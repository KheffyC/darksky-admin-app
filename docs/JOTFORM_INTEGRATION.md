# Jotform Integration Documentation

## Overview
The Jotform integration allows automatic import of member data from Jotform submissions. This eliminates the need for manual data entry and ensures consistency between your registration forms and member database.

## Features

### ✅ **Core Functionality**
- **API Integration**: Connect to Jotform via API key
- **Form Selection**: Choose from your available Jotform forms
- **Field Mapping**: Map Jotform fields to member fields
- **Automatic Import**: Sync members with one click
- **Duplicate Prevention**: Prevents duplicate member creation
- **Error Handling**: Comprehensive error logging and recovery

### ✅ **Data Mapping**
- **Automatic Detection**: Smart field mapping based on common patterns
- **Flexible Mapping**: Manual override for custom field mappings
- **Required Fields**: Validates required member data (first name, last name, email)
- **Data Types**: Handles text, numbers, dates, and phone numbers

### ✅ **Import Management**
- **Incremental Sync**: Import only new submissions since last sync
- **Full Sync**: Import all submissions from a form
- **Batch Processing**: Processes large datasets efficiently
- **Progress Tracking**: Real-time import status and progress

### ✅ **Monitoring & Logging**
- **Import History**: Complete log of all import operations
- **Error Tracking**: Detailed error reporting and troubleshooting
- **Success Metrics**: Count of imported, skipped, and failed records
- **User Attribution**: Track who triggered each import

## Setup Guide

### 1. **Get Jotform API Key**
1. Log into your Jotform account
2. Go to Account Settings → API
3. Generate a new API key
4. Copy the API key for use in the integration

### 2. **Configure Integration**
1. Navigate to **Dashboard → Settings**
2. Scroll to the **Integrations** section
3. In the **Jotform Integration** card:
   - Paste your API key
   - Click **Test** to verify connection
   - Select your registration form from the dropdown
   - Review the auto-generated field mappings
   - Enable the integration
   - Click **Save Settings**

### 3. **Test Import**
1. Click **Sync Now** to test the integration
2. Check the import results in the popup
3. Review the **Import History** for detailed logs
4. Verify imported members in the Member Ledger

## Field Mapping

### **Supported Member Fields**
- `Legal Name` - Legal Name (required)
- `email` - Email Address (required)
- `phone` - Phone Number
- `birthday` - Birth Date
- `age` - Age (number)
- `section` - Section/Group

### **Automatic Field Detection**
The system automatically detects common field patterns:
- **First Name**: "first name", "given name", "fname"
- **Last Name**: "last name", "family name", "surname", "lname"
- **Email**: "email", "e-mail"
- **Phone**: "phone", "mobile", "cell"
- **Birthday**: "birth date", "birthday", "dob"
- **Age**: "age"
- **Section**: "section", "group", "team", "class"

### **Manual Field Mapping**
You can customize field mappings by:
1. Editing the auto-generated mappings
2. Adding new field mappings
3. Removing unwanted mappings
4. Marking fields as required/optional

## Import Process

### **How It Works**
1. **Connection**: System connects to Jotform using your API key
2. **Retrieval**: Fetches form submissions based on sync settings
3. **Mapping**: Applies field mappings to transform data
4. **Validation**: Validates required fields and data formats
5. **Deduplication**: Checks for existing members by email/submission ID
6. **Creation**: Creates new member records in the database
7. **Logging**: Records import results and any errors

### **Sync Options**
- **Incremental Sync**: Only imports new submissions since last sync
- **Full Sync**: Imports all submissions from the form
- **Manual Trigger**: Run sync on-demand from the settings page
- **Scheduled Sync**: (Future feature) Automatic periodic syncing

### **Error Handling**
- **Invalid Data**: Skips records with missing required fields
- **Duplicate Emails**: Prevents duplicate member creation
- **API Errors**: Retries failed requests with exponential backoff
- **Partial Failures**: Continues processing even if some records fail

## Troubleshooting

### **Common Issues**

#### **Connection Failed**
- ✅ Verify API key is correct
- ✅ Check Jotform account has API access enabled
- ✅ Ensure API key has proper permissions

#### **No Forms Available**
- ✅ Verify you have forms in your Jotform account
- ✅ Check if forms are published and accessible
- ✅ Refresh the form list

#### **Import Errors**
- ✅ Check field mappings are correct
- ✅ Verify required fields are mapped
- ✅ Review error details in import history
- ✅ Check for data format issues (dates, emails, etc.)

#### **Duplicate Members**
- ✅ System automatically prevents duplicates by email
- ✅ Check if member already exists with same email
- ✅ Review duplicate count in import results

### **Error Codes**
- **400**: Invalid API key or form ID
- **401**: Unauthorized - check API key permissions
- **404**: Form not found
- **429**: Rate limit exceeded - try again later
- **500**: Server error - check logs for details

## Best Practices

### **Form Design**
- Use clear, descriptive field labels
- Include all required member information
- Use consistent naming conventions
- Validate data at form level when possible

### **Data Quality**
- Regularly review and clean imported data
- Monitor import logs for recurring issues
- Test with sample data before full deployment
- Backup database before major imports

### **Security**
- Keep API keys secure and private
- Use strong passwords for Jotform account
- Regularly rotate API keys
- Monitor integration usage logs

### **Performance**
- Sync incrementally when possible
- Avoid frequent full syncs of large datasets
- Monitor import duration and optimize if needed
- Use batch processing for large imports

## Technical Details

### **Database Schema**
```sql
-- Integration Settings
CREATE TABLE IntegrationSettings (
    id TEXT PRIMARY KEY,
    jotformApiKey TEXT,
    jotformFormId TEXT,
    fieldMapping TEXT, -- JSON
    lastSyncDate TIMESTAMP,
    isActive BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP
);

-- Import Logs
CREATE TABLE ImportLog (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    status TEXT NOT NULL, -- success/error/partial
    membersImported INTEGER DEFAULT 0,
    errorsCount INTEGER DEFAULT 0,
    errorDetails TEXT, -- JSON
    startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completedAt TIMESTAMP,
    triggeredBy TEXT
);

-- Extended Member Fields
ALTER TABLE Member ADD COLUMN birthday DATE;
ALTER TABLE Member ADD COLUMN age INTEGER;
ALTER TABLE Member ADD COLUMN jotformSubmissionId TEXT;
ALTER TABLE Member ADD COLUMN source TEXT DEFAULT 'manual';
```

### **API Endpoints**
- `POST /api/integrations/settings` - Save integration settings
- `GET /api/integrations/settings` - Get integration settings
- `POST /api/integrations/jotform/test` - Test API connection
- `POST /api/integrations/jotform/forms` - Get user forms
- `POST /api/integrations/jotform/questions` - Get form questions
- `POST /api/integrations/jotform/sync` - Sync members
- `GET /api/integrations/history` - Get import history

### **Rate Limiting**
- Jotform API has rate limits
- System implements exponential backoff
- Batch processing prevents overwhelming the API
- Monitor usage to avoid limits

## Support

For technical issues or questions:
1. Check the import history for error details
2. Review this documentation
3. Verify your Jotform API key and permissions
4. Contact system administrator if issues persist

## Changelog

### v1.0.0 (Initial Release)
- ✅ Basic Jotform API integration
- ✅ Field mapping interface
- ✅ Member import functionality
- ✅ Import history and logging
- ✅ Duplicate prevention
- ✅ Error handling and recovery

### Future Enhancements
- 🔄 Scheduled automatic syncing
- 🔄 Webhook support for real-time imports
- 🔄 Advanced field mapping options
- 🔄 Multi-form support
- 🔄 Data transformation rules
- 🔄 Export functionality
