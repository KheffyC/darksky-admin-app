import { db } from './db';
import { members, integrationSettings, importLogs, Settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { JotformService, MemberData, FieldMapping } from './jotform';
import { nanoid } from 'nanoid';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errorCount: number;
  errors: string[];
  duplicateCount: number;
  logId: string;
}

export interface ImportOptions {
  formId: string;
  fieldMappings: FieldMapping[];
  defaultSeason: string;
  sinceLast?: boolean;
  triggeredBy?: string;
  tuitionAmount?: number;
}

export class MemberImportService {
  private jotformService: JotformService;

  constructor(apiKey: string) {
    this.jotformService = new JotformService(apiKey);
  }

  /**
   * Import members from Jotform
   */
  async importMembers(options: ImportOptions): Promise<ImportResult> {
    const logId = nanoid();
    const startTime = new Date();
    let importedCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    try {
      // Create initial log entry
      await db.insert(importLogs).values({
        id: logId,
        source: 'jotform',
        status: 'running',
        membersImported: 0,
        errorsCount: 0,
        startedAt: startTime.toISOString(),
        triggeredBy: options.triggeredBy || 'system'
      });

      // Get submissions
      let submissions;
      if (options.sinceLast) {
        const lastSync = await this.getLastSyncDate(options.formId);
        submissions = await this.jotformService.getSubmissionsSince(
          options.formId, 
          lastSync || new Date(0)
        );
      } else {
        submissions = await this.jotformService.getFormSubmissions(options.formId);
      }
      
      // Process submissions in batches
      const batchSize = 10;
      for (let i = 0; i < submissions.length; i += batchSize) {
        const batch = submissions.slice(i, i + batchSize);
        
        for (const submission of batch) {
          try {            
            // Map submission to member data
            const memberData = this.jotformService.mapSubmissionToMember(
              submission,
              options.fieldMappings,
              options.defaultSeason
            );

            if (!memberData) {
              errorCount++;
              const errorMsg = `Failed to map submission ${submission.id}: Invalid or missing required data`;
              errors.push(errorMsg);
              console.warn('Mapping failed for submission:', submission.id, 'Available answers:', Object.keys(submission.answers));
              continue;
            }

            // Check for existing member
            const existingMember = await this.findExistingMember(memberData);
            if (existingMember) {
              duplicateCount++;
              continue;
            }

            // Create member
            await this.createMember(memberData, options.tuitionAmount);
            importedCount++;
          } catch (error) {
            errorCount++;
            const errorMessage = `Failed to process submission ${submission.id}: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMessage);
            console.error(errorMessage);
          }
        }

        // Small delay between batches to avoid overwhelming the system
        if (i + batchSize < submissions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update integration settings with last sync date
      await this.updateLastSyncDate(new Date(), options.formId);

      // Update log entry
      await db.update(importLogs)
        .set({
          status: errorCount > 0 ? 'partial' : 'success',
          membersImported: importedCount,
          errorsCount: errorCount,
          errorDetails: errors.length > 0 ? JSON.stringify(errors) : null,
          completedAt: new Date().toISOString()
        })
        .where(eq(importLogs.id, logId));

      return {
        success: true,
        importedCount,
        errorCount,
        errors,
        duplicateCount,
        logId
      };

    } catch (error) {
      // Update log entry with error
      await db.update(importLogs)
        .set({
          status: 'error',
          membersImported: importedCount,
          errorsCount: errorCount + 1,
          errorDetails: JSON.stringify([...errors, error instanceof Error ? error.message : String(error)]),
          completedAt: new Date().toISOString()
        })
        .where(eq(importLogs.id, logId));

      throw error;
    }
  }

  /**
   * Find existing member by email or Jotform submission ID
   */
  private async findExistingMember(memberData: MemberData): Promise<any> {
    // Check by Jotform submission ID first
    const existingBySubmission = await db.query.members.findFirst({
      where: eq(members.jotformSubmissionId, memberData.jotformSubmissionId)
    });

    if (existingBySubmission) {
      return existingBySubmission;
    }

    // Check by email
    const existingByEmail = await db.query.members.findFirst({
      where: eq(members.email, memberData.email)
    });

    return existingByEmail;
  }

  /**
   * Create a new member
   */
  private async createMember(memberData: MemberData, tuitionAmount: any): Promise<void> {
    await db.insert(members).values({
      id: nanoid(),
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      legalName: memberData.legalName || null,
      email: memberData.email,
      phone: memberData.phone || null,
      parentEmail: memberData.parentEmail || null,
      parentPhone: memberData.parentPhone || null,
      address: memberData.address || null,
      birthday: memberData.birthday || null,
      age: memberData.age || null,
      section: memberData.section || null,
      instrument: memberData.instrument || null,
      serialNumber: memberData.serialNumber || null,
      season: memberData.season,
      jotformSubmissionId: memberData.jotformSubmissionId,
      source: memberData.source,
      tuitionAmount: tuitionAmount, // Default tuition amount
      contractSigned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get last sync date from integration settings
   */
  private async getLastSyncDate(jotformFormId: string): Promise<Date | null> {
    const settings = await db.query.integrationSettings.findFirst({
      where: eq(integrationSettings.jotformFormId, jotformFormId)
    });

    return settings?.lastSyncDate ? new Date(settings.lastSyncDate) : null;
  }

  /**
   * Update last sync date
   */
  private async updateLastSyncDate(date: Date, jotformFormId: string): Promise<void> {
    const settings = await db.query.integrationSettings.findFirst({
      where: eq(integrationSettings.jotformFormId, jotformFormId)
    });

    if (settings) {
      await db.update(integrationSettings)
        .set({
          lastSyncDate: date.toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(integrationSettings.id, settings.id));
    }
  }

  /**
   * Get import history
   */
  async getImportHistory(limit: number = 10): Promise<any[]> {
    return await db.query.importLogs.findMany({
      orderBy: (importLogs, { desc }) => [desc(importLogs.startedAt)],
      limit
    });
  }
}

export default MemberImportService;
