'use client';
import React, { useState, useEffect } from 'react';
import { JotformForm, JotformQuestion, FieldMapping } from '@/lib/jotform';
import { useToastNotifications } from '@/hooks/useToastNotifications';

interface JotformIntegrationSettingsProps {
  onSave?: () => void;
}

export function JotformIntegrationSettings({ onSave }: JotformIntegrationSettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [formId, setFormId] = useState('');
  const [forms, setForms] = useState<JotformForm[]>([]);
  const [questions, setQuestions] = useState<JotformQuestion[]>([]);
  const [allQuestions, setAllQuestions] = useState<JotformQuestion[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [connectionValid, setConnectionValid] = useState<boolean | null>(null);
  const [analysisData, setAnalysisData] = useState<{
    totalQuestionsFound?: number;
    filteredCount?: number;
  } | null>(null);
  const [syncMessage, setSyncMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const toast = useToastNotifications();

  // Load existing settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/integrations/settings');
      const data = await response.json();
      
      if (data.id) {
        setApiKey(data.hasApiKey ? '••••••••••••••••' : '');
        setFormId(data.jotformFormId || '');
        setFieldMappings(data.fieldMapping || []);
        setIsActive(data.isActive || false);
        setLastSyncDate(data.lastSyncDate);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const testConnection = async () => {
    if (!apiKey || apiKey.includes('•')) {
      toast.warning('Invalid API Key', 'Please enter a valid API key');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/integrations/jotform/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });

      const data = await response.json();
      setConnectionValid(data.isValid);
      
      if (data.isValid) {
        loadForms();
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionValid(false);
    } finally {
      setTesting(false);
    }
  };

  const loadForms = async () => {
    if (!apiKey || apiKey.includes('•')) return;

    setLoadingForms(true);
    try {
      const response = await fetch('/api/integrations/jotform/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });

      const data = await response.json();
      setForms(data);
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setLoadingForms(false);
    }
  };

  const loadQuestions = async (selectedFormId: string) => {
    if (!apiKey || apiKey.includes('•')) return;

    try {
      // Get filtered questions and mappings
      const response = await fetch('/api/integrations/jotform/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, formId: selectedFormId })
      });

      const data = await response.json();
      
      setQuestions(data.questions || []);
      setFieldMappings(data.suggestedMappings || []);
      setAnalysisData({
        totalQuestionsFound: data.totalQuestionsFound,
        filteredCount: data.filteredCount
      });
      
      // Get all unfiltered questions for manual mapping
      const rawResponse = await fetch('/api/integrations/jotform/raw-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, formId: selectedFormId })
      });
      
      if (rawResponse.ok) {
        const rawData = await rawResponse.json();
        setAllQuestions(rawData.questions || []);
      }

      // Auto-save settings when form is selected
      await autoSave(selectedFormId, data.suggestedMappings || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Filter out incomplete field mappings before saving
      const validFieldMappings = fieldMappings.filter(mapping => 
        mapping.jotformField && 
        mapping.jotformField.trim() !== '' && 
        mapping.memberField && 
        mapping.memberField.trim() !== ''
      );


      const response = await fetch('/api/integrations/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jotformApiKey: apiKey.includes('•') ? undefined : apiKey,
          jotformFormId: formId,
          fieldMapping: validFieldMappings,
          isActive
        })
      });

      if (response.ok) {
        toast.success('Settings Saved', 'Jotform integration settings have been saved successfully!');
        if (onSave) onSave();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Save Failed', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async (selectedFormId: string, mappings: FieldMapping[]) => {
    try {
      // Filter out incomplete field mappings before saving
      const validFieldMappings = mappings.filter(mapping => 
        mapping.jotformField && 
        mapping.jotformField.trim() !== '' && 
        mapping.memberField && 
        mapping.memberField.trim() !== ''
      );

      const response = await fetch('/api/integrations/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jotformApiKey: apiKey.includes('•') ? undefined : apiKey,
          jotformFormId: selectedFormId,
          fieldMapping: validFieldMappings,
          isActive
        })
      });

      if (response.ok) {
        if (onSave) onSave();
      } else {
        throw new Error('Failed to auto-save settings');
      }
    } catch (error) {
      console.error('Failed to auto-save settings:', error);
    }
  };

  const addFieldMapping = () => {
    setFieldMappings([...fieldMappings, { 
      jotformField: '', 
      jotformFieldName: '',
      memberField: '', 
      memberFieldName: '',
      required: false
    }]);
  };

  const updateFieldMapping = (index: number, field: 'jotformField' | 'memberField', value: string) => {
    const updated = [...fieldMappings];
    updated[index] = { 
      ...updated[index], 
      [field]: value,
      // Update field names as well
      ...(field === 'jotformField' ? { jotformFieldName: value } : {}),
      ...(field === 'memberField' ? { memberFieldName: value } : {})
    };
    setFieldMappings(updated);
    
    // Auto-save when mappings are updated
    if (formId) {
      setTimeout(() => autoSave(formId, updated), 500); // Debounce to avoid too many saves
    }
  };

  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const memberFields = [ 
    'legalName',
    'email',
    'phone',
    'parentEmail',
    'parentPhone',
    'address',
    'section',
    'serialNumber',
    'season'
  ];

  const inputClassName =
    'w-full rounded-xl border border-[#d6dde5] bg-white px-4 py-3 text-black placeholder:text-[#788896] transition-colors duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]';
  const selectClassName =
    'w-full rounded-xl border border-[#d6dde5] bg-white px-4 py-3 text-black transition-colors duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]';
  const labelClassName = 'block text-sm font-semibold text-black';

  return (
    <div className="space-y-8">
        {/* API Key */}
        <div className="space-y-3">
          <label className={labelClassName}>
            Jotform API Key *
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Jotform API key"
            className={inputClassName}
          />
          <p className="text-sm text-[#788896]">
            Get your API key from{' '}
            <a 
              href="https://www.jotform.com/myaccount/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#0D47A1] underline transition-colors duration-200 hover:text-black"
            >
              Jotform API Settings
            </a>
          </p>
        </div>

        {/* Test Connection */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={testConnection}
              disabled={testing || !apiKey || apiKey.includes('•')}
              className="rounded-lg border border-[#f38d68] bg-[#f38d68] px-4 py-2 font-semibold text-black transition-colors duration-200 hover:bg-[#f5a07f] disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={loadForms}
              disabled={loadingForms || !connectionValid}
              className="rounded-lg border border-[#d6dde5] bg-white px-4 py-2 font-semibold text-black transition-colors duration-200 hover:bg-[#f7f9fb] disabled:cursor-not-allowed disabled:bg-[#eef3f8] disabled:text-[#788896]"
            >
              {loadingForms ? 'Loading...' : 'Refresh Forms'}
            </button>
          </div>
          {connectionValid === true && (
            <p className="text-sm font-semibold text-emerald-800">Connection successful</p>
          )}
          {connectionValid === false && (
            <p className="text-sm font-semibold text-rose-800">Connection failed</p>
          )}
        </div>

        {/* Form Selection */}
        {forms.length > 0 && (
          <div className="space-y-3">
            <label className={labelClassName}>
              Select Form *
            </label>
            <select
              value={formId}
              onChange={(e) => {
                const selectedFormId = e.target.value;
                setFormId(selectedFormId);
                if (selectedFormId) {
                  loadQuestions(selectedFormId);
                }
              }}
              className={selectClassName}
            >
              <option value="">Select a form</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Form Analysis Summary */}
        {analysisData && (
          <div className="rounded-lg border border-[#d6dde5] bg-[#f7f9fb] p-4">
            <h4 className="mb-2 font-semibold text-black">Form Analysis</h4>
            <p className="text-sm text-[#788896]">
              Found {analysisData.totalQuestionsFound} total questions, using {analysisData.filteredCount} for mapping
              {analysisData.totalQuestionsFound !== analysisData.filteredCount && 
                ` (filtered out ${(analysisData.totalQuestionsFound || 0) - (analysisData.filteredCount || 0)} fields)`
              }
            </p>
          </div>
        )}

        {/* Field Mappings */}
        {questions.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold tracking-[-0.03em] text-black">Field Mappings</h4>
            <div className="space-y-3">
              {fieldMappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border border-[#d6dde5] bg-white p-3">
                  <select
                    value={mapping.jotformField}
                    onChange={(e) => updateFieldMapping(index, 'jotformField', e.target.value)}
                    className="flex-1 rounded-lg border border-[#d6dde5] bg-white px-3 py-2 text-black transition-colors duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]"
                  >
                    <option value="">Select Jotform field</option>
                    {questions.map((q) => (
                      <option key={q.qid} value={q.qid}>
                        {q.text} (ID: {q.qid})
                      </option>
                    ))}
                  </select>
                  <span className="font-semibold text-[#788896]">→</span>
                  <select
                    value={mapping.memberField}
                    onChange={(e) => updateFieldMapping(index, 'memberField', e.target.value)}
                    className="flex-1 rounded-lg border border-[#d6dde5] bg-white px-3 py-2 text-black transition-colors duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]"
                  >
                    <option value="">Select member field</option>
                    {memberFields.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeFieldMapping(index)}
                    className="rounded p-2 text-rose-800 transition-colors duration-200 hover:bg-rose-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addFieldMapping}
              className="rounded-lg border border-[#d6dde5] bg-white px-4 py-2 font-semibold text-black transition-colors duration-200 hover:bg-[#f7f9fb]"
            >
              Add Field Mapping
            </button>
          </div>
        )}

        {/* Manual Field Mapping Section */}
        {allQuestions.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-[#d6dde5] bg-[#f7f9fb] p-6">
            <h4 className="text-lg font-semibold tracking-[-0.03em] text-black">Manual Field Mapping</h4>
            <p className="text-sm text-[#788896]">
              Map any field from the form using its field ID. This includes fields that were filtered out automatically.
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="Enter Jotform field ID (e.g., 3, 4, 5)"
                  className="flex-1 rounded-lg border border-[#d6dde5] bg-white px-3 py-2 text-black placeholder:text-[#788896] transition-colors duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const fieldId = (e.target as HTMLInputElement).value.trim();
                      if (fieldId) {
                        setFieldMappings([...fieldMappings, { 
                          jotformField: fieldId, 
                          jotformFieldName: fieldId,
                          memberField: '', 
                          memberFieldName: '',
                          required: false
                        }]);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="Enter Jotform field ID"]') as HTMLInputElement;
                    const fieldId = input?.value.trim();
                    if (fieldId) {
                      setFieldMappings([...fieldMappings, { 
                        jotformField: fieldId, 
                        jotformFieldName: fieldId,
                        memberField: '', 
                        memberFieldName: '',
                        required: false
                      }]);
                      input.value = '';
                    }
                  }}
                  className="rounded-lg border border-[#f38d68] bg-[#f38d68] px-4 py-2 font-semibold text-black transition-colors duration-200 hover:bg-[#f5a07f]"
                >
                  Add Manual Mapping
                </button>
              </div>
            </div>

            {/* Debug Section: Show All Available Fields */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-black transition-colors duration-200 hover:text-black">
                Show All Available Fields ({allQuestions.length})
              </summary>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[#d6dde5] bg-white p-3">
                {allQuestions.map((q) => (
                  <div key={q.qid} className="border-b border-[#e8edf3] py-1 text-xs text-[#788896] last:border-b-0">
                    <strong className="text-[#0D47A1]">ID {q.qid}:</strong> {q.text || q.type} 
                    {q.type && <span className="text-[#9aa7b6]"> ({q.type})</span>}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Integration Status */}
        <div className="flex items-center justify-between rounded-lg border border-[#d6dde5] bg-white p-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => {
                  setIsActive(e.target.checked);
                  // Auto-save when integration status changes
                  if (formId) {
                    setTimeout(() => autoSave(formId, fieldMappings), 100);
                  }
                }}
                className="mr-3 h-4 w-4 accent-[#f38d68]"
              />
              <span className="font-semibold text-black">Enable Integration</span>
            </label>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#788896]">
              Last Sync: {lastSyncDate ? new Date(lastSyncDate).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>

        {/* Manual Sync Controls */}
        <div className="border-t border-[#d6dde5] pt-4">
          <div className="flex items-center gap-3">
            {/* Regular Sync Button */}
            <button
              onClick={async () => {
                setSyncing(true);
                setSyncMessage(null); // Clear previous message
                try {
                  const response = await fetch('/api/integrations/jotform/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sinceLast: false, triggeredBy: 'manual', jotformFormId: formId })
                  });

                  const result = await response.json();
                  
                  if (result.success !== false && !result.error) {
                    const imported = result.importedCount ?? 0;
                    const errors = result.errorCount ?? 0;
                    const duplicates = result.duplicateCount ?? 0;
                    
                    setSyncMessage({
                      type: 'success',
                      text: `Sync completed! Imported: ${imported}, Errors: ${errors}, Duplicates: ${duplicates}`
                    });
                    loadSettings();
                    
                    // Clear message after 5 seconds
                    setTimeout(() => setSyncMessage(null), 5000);
                  } else {
                    throw new Error(result.error || 'Sync failed');
                  }
                } catch (error) {
                  console.error('Sync failed:', error);
                  setSyncMessage({
                    type: 'error',
                    text: `Sync failed: ${error instanceof Error ? error.message : String(error)}`
                  });
                  
                  // Clear error message after 5 seconds
                  setTimeout(() => setSyncMessage(null), 5000);
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing || !isActive}
              className="rounded-lg border border-emerald-400 bg-emerald-100 px-6 py-2 font-semibold text-emerald-900 transition-colors duration-200 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            
            {/* Sync Message */}
            {syncMessage && (
              <div className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                syncMessage.type === 'success'
                  ? 'border border-emerald-400 bg-emerald-100 text-emerald-900'
                  : 'border border-rose-400 bg-rose-100 text-rose-900'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  syncMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}></div>
                {syncMessage.text}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

export default JotformIntegrationSettings;
