# Bulk User Import Feature

This feature allows tenants to import large numbers of users via CSV files using background processing with Inngest.

## Features

- ✅ CSV file upload with validation
- ✅ Background processing with Inngest
- ✅ Real-time progress tracking
- ✅ Error reporting and success tracking
- ✅ Multi-tenant support
- ✅ Vercel Blob storage integration
- ✅ Duplicate email detection
- ✅ Loyalty points initialization
- ✅ Chunked processing for large files

## Architecture

### Components

1. **Frontend UI** (`/users/bulk-upload`)
   - File upload interface
   - Progress tracking
   - Error display
   - Template download

2. **API Routes**
   - `/api/users/bulk-upload` - Handles file upload and job creation
   - `/api/users/import-status/[jobId]` - Returns job progress
   - `/api/inngest` - Inngest webhook endpoint

3. **Background Processing**
   - Inngest function for CSV parsing and user creation
   - Chunked processing (50 users per chunk)
   - Progress updates after each chunk

4. **Database**
   - `import_jobs` table for tracking progress
   - User creation with loyalty points initialization

## CSV Format

### Required Columns
- `Name` - User's full name
- `Email` - User's email address (must be unique within tenant)

### Optional Columns
- `Phone` - User's phone number
- `Buyer NTN Or CNIC` - Tax identification number
- `Buyer Business Name` - Business name
- `Buyer Province` - Province/state
- `Buyer Address` - Full address
- `Buyer Registration Type` - Individual, Company, Partnership, etc.

### Example CSV
```csv
Name,Email,Phone,Buyer NTN Or CNIC,Buyer Business Name,Buyer Province,Buyer Address,Buyer Registration Type
"John Doe","john.doe@example.com","+92300-1234567","1234567890123","Doe Industries","Punjab","123 Business Street, Lahore","Individual"
"Jane Smith","jane.smith@example.com","+92321-9876543","9876543210987","Smith Trading Co","Sindh","456 Commerce Avenue, Karachi","Company"
```

## Usage

### 1. Access Bulk Import
- Navigate to Users page
- Click "Bulk Import" button
- Or go directly to `/users/bulk-upload`

### 2. Download Template
- Click "Download CSV Template" to get the correct format
- Fill in your user data

### 3. Upload File
- Select your CSV file (up to 100MB)
- Click "Start Import"
- Monitor real-time progress

### 4. Review Results
- View successful imports
- Check error details for failed records
- Navigate to Users list when complete

## Technical Details

### File Processing
- Maximum file size: 100MB (~200,000 users)
- Supported format: CSV only
- Processing: 50 users per chunk
- Storage: Vercel Blob with public access

### Error Handling
- Invalid email format
- Duplicate emails within tenant
- Missing required fields
- Database connection errors
- File parsing errors

### Progress Tracking
- Total records count
- Processed records
- Successful vs failed records
- Estimated time remaining
- Real-time updates every 2 seconds

### Multi-Tenant Support
- Each tenant can only see their own import jobs
- Users are created within the correct tenant
- Tenant isolation maintained throughout process

## Environment Variables

Add these to your `.env.local`:

```env
# Inngest (if using Inngest Cloud)
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# Vercel Blob (automatically configured on Vercel)
BLOB_READ_WRITE_TOKEN=your-blob-token
```

## Database Migration

Run the migration to add the import_jobs table:

```bash
mysql -h your-db-host -u your-db-user -p your-db-name < migrations/add-import-jobs-table.sql
```

## API Reference

### POST /api/users/bulk-upload
Upload CSV file and start import job.

**Body:** FormData
- `file`: CSV file
- `uploadedBy`: User identifier

**Response:**
```json
{
  "jobId": "uuid",
  "message": "User import job started",
  "fileName": "users.csv",
  "fileSize": 12345,
  "estimatedUsers": 25
}
```

### GET /api/users/import-status/[jobId]
Get import job status and progress.

**Response:**
```json
{
  "id": "uuid",
  "fileName": "users.csv",
  "status": "processing",
  "totalRecords": 100,
  "processedRecords": 75,
  "successfulRecords": 70,
  "failedRecords": 5,
  "progressPercent": 75,
  "estimatedTimeRemaining": 30,
  "errors": [
    {
      "row": 5,
      "email": "invalid-email",
      "message": "Invalid email format"
    }
  ],
  "results": {
    "successful": 70,
    "failed": 5,
    "successfulUsers": [...]
  }
}
```

## Performance Considerations

### Large Files
- Files are processed in chunks to prevent memory issues
- Background processing prevents timeout issues
- Progress updates provide user feedback

### Database Impact
- Chunked inserts reduce lock contention
- Indexes on import_jobs table for fast queries
- Foreign key constraints maintain data integrity

### Scalability
- Inngest handles concurrency (max 10 concurrent imports)
- Vercel Blob provides reliable file storage
- Tenant isolation ensures security

## Troubleshooting

### Common Issues

**"Failed to start import: Vercel Blob: access must be 'public'"**
- Vercel Blob requires public access for direct URL fetching
- This is configured correctly in the code

**Import stuck in "pending" status**
- Check Inngest dashboard for function execution
- Verify Inngest webhook is properly configured
- Check server logs for errors

**"Tenant not found" errors**
- Ensure user is accessing from correct subdomain
- Check tenant exists in database
- Verify middleware is working

**CSV parsing errors**
- Check CSV format matches template
- Ensure proper encoding (UTF-8)
- Verify required columns are present

### Monitoring

- Check Inngest dashboard for job execution
- Monitor database for import_jobs records
- Review server logs for detailed errors
- Use Vercel dashboard for API performance

## Security Considerations

- Files are uploaded to Vercel Blob with public access (required for processing)
- Tenant isolation prevents cross-tenant data access
- Input validation prevents malicious data
- File size limits prevent resource exhaustion
- Background processing prevents direct database exposure

## Future Enhancements

- Support for additional file formats (Excel, JSON)
- Advanced field mapping interface
- Bulk update existing users
- Import scheduling
- Email notifications on completion
- Import history and analytics
