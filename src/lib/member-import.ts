import { db } from './db';
import { members, integrationSettings, importLogs, tuitionEditLogs } from '@/db/schema';
import { and, eq, lt, sql } from 'drizzle-orm';
import { JotformService, MemberData, FieldMapping } from './jotform';
import { nanoid } from 'nanoid';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errorCount: number;
  errors: string[];
  duplicateCount: number;
  returningCount: number;
  season: string;
  logId: string;
}

export interface ImportOptions {
  formId: string;
  fieldMappings: FieldMapping[];
  defaultSeason: string;
  sinceLast?: boolean;
  triggeredBy?: string;
  tuitionAmount?: number;
  vetDiscount?: number; // Tuition discount per completed prior season
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
    let returningCount = 0;
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

            const priorSeasons = await this.countPriorSeasons(memberData.email, memberData.season);
            if (priorSeasons > 0) returningCount++;

            await this.createMember(memberData, options.tuitionAmount ?? 0, priorSeasons, options.vetDiscount ?? 0);
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
        returningCount,
        season: options.defaultSeason,
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
   * Find an existing member for this submission: the same submission in any
   * season, or the same email within the season being imported. The same email
   * in another season is a returner, not a duplicate.
   */
  private async findExistingMember(memberData: MemberData): Promise<any> {
    const existingBySubmission = await db.query.members.findFirst({
      where: eq(members.jotformSubmissionId, memberData.jotformSubmissionId)
    });

    if (existingBySubmission) {
      return existingBySubmission;
    }

    return db.query.members.findFirst({
      where: and(sameEmail(memberData.email), eq(members.season, memberData.season))
    });
  }

  /**
   * Completed seasons before this one: earlier seasons where this person was a
   * member and wasn't archived.
   */
  private async countPriorSeasons(email: string, season: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(distinct ${members.season})::int` })
      .from(members)
      .where(and(sameEmail(email), lt(members.season, season), eq(members.isActive, true)));
    return row?.count ?? 0;
  }

  /**
   * Create a new member
   */
  private async createMember(
    memberData: MemberData,
    tuitionAmount: number,
    priorSeasons: number,
    vetDiscount: number
  ): Promise<void> {
    const discount = priorSeasons * vetDiscount;
    const discountedTuition = Math.max(tuitionAmount - discount, 0);
    const id = nanoid();

    await db.insert(members).values({
      id,
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      legalName: memberData.legalName || null,
      email: memberData.email,
      phone: memberData.phone || null,
      parentEmail: memberData.parentEmail || null,
      parentPhone: memberData.parentPhone || null,
      address: memberData.address || null,
      mailingAddress: memberData.mailingAddress || null,
      school: memberData.school || null,
      birthday: memberData.birthday || null,
      age: memberData.age ?? null,
      section: memberData.section || null,
      instrument: memberData.instrument || null,
      serialNumber: memberData.serialNumber || null,
      season: memberData.season,
      jotformSubmissionId: memberData.jotformSubmissionId,
      source: memberData.source,
      tuitionAmount: discountedTuition,
      contractSigned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Record the vet discount in the tuition history so it's visible and reversible
    if (discount > 0) {
      await db.insert(tuitionEditLogs).values({
        id: nanoid(),
        memberId: id,
        oldAmount: Math.round(tuitionAmount),
        newAmount: Math.round(discountedTuition),
        editedBy: `Import: vet discount (${priorSeasons} prior season${priorSeasons === 1 ? '' : 's'})`,
        editedAt: new Date().toISOString(),
      });
    }
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

/** Case-insensitive email match; people don't always type it the same way twice */
function sameEmail(email: string) {
  return sql`lower(${members.email}) = lower(${email})`;
}

export default MemberImportService;
