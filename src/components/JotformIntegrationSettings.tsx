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

  return (
    <div className="space-y-8">
        {/* API Key */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Jotform API Key *
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Jotform API key"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          />
          <p className="text-sm text-gray-400">
            Get your API key from{' '}
            <a 
              href="https://www.jotform.com/myaccount/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
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
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={loadForms}
              disabled={loadingForms || !connectionValid}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              {loadingForms ? 'Loading...' : 'Refresh Forms'}
            </button>
          </div>
          {connectionValid === true && (
            <p className="text-green-400 text-sm font-medium">✓ Connection successful</p>
          )}
          {connectionValid === false && (
            <p className="text-red-400 text-sm font-medium">✗ Connection failed</p>
          )}
        </div>

        {/* Form Selection */}
        {forms.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
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
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
          <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
            <h4 className="font-medium text-blue-300 mb-2">Form Analysis</h4>
            <p className="text-sm text-blue-200">
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
            <h4 className="text-lg font-medium text-gray-300">Field Mappings</h4>
            <div className="space-y-3">
              {fieldMappings.map((mapping, index) => (
                <div key={index} className="flex gap-3 items-center p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                  <select
                    value={mapping.jotformField}
                    onChange={(e) => updateFieldMapping(index, 'jotformField', e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">Select Jotform field</option>
                    {questions.map((q) => (
                      <option key={q.qid} value={q.qid}>
                        {q.text} (ID: {q.qid})
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-400 font-medium">→</span>
                  <select
                    value={mapping.memberField}
                    onChange={(e) => updateFieldMapping(index, 'memberField', e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                    className="text-red-400 hover:text-red-300 p-2 transition-colors duration-200 hover:bg-red-500/10 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addFieldMapping}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              Add Field Mapping
            </button>
          </div>
        )}

        {/* Manual Field Mapping Section */}
        {allQuestions.length > 0 && (
          <div className="p-6 bg-gray-800/50 border border-gray-600 rounded-lg space-y-4">
            <h4 className="text-lg font-medium text-gray-300">Manual Field Mapping</h4>
            <p className="text-sm text-gray-400">
              Map any field from the form using its field ID. This includes fields that were filtered out automatically.
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="Enter Jotform field ID (e.g., 3, 4, 5)"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Add Manual Mapping
                </button>
              </div>
            </div>

            {/* Debug Section: Show All Available Fields */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200">
                Show All Available Fields ({allQuestions.length})
              </summary>
              <div className="mt-2 max-h-40 overflow-y-auto bg-gray-700 border border-gray-600 p-3 rounded-lg">
                {allQuestions.map((q) => (
                  <div key={q.qid} className="text-xs text-gray-300 py-1 border-b border-gray-600 last:border-b-0">
                    <strong className="text-blue-400">ID {q.qid}:</strong> {q.text || q.type} 
                    {q.type && <span className="text-gray-500"> ({q.type})</span>}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Integration Status */}
        <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-600 rounded-lg">
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
                className="mr-3 w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white font-medium">Enable Integration</span>
            </label>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">
              Last Sync: {lastSyncDate ? new Date(lastSyncDate).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>

        {/* Manual Sync Controls */}
        <div className="pt-4 border-t border-gray-600">
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
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors duration-200 font-semibold"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            
            {/* Sync Message */}
            {syncMessage && (
              <div className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                syncMessage.type === 'success'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  syncMessage.type === 'success' ? 'bg-green-400' : 'bg-red-400'
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
