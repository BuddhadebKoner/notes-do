# Google Drive API Setup Guide

## Prerequisites
Before you can use the Google Drive integration for file uploads, you need to set up Google Drive API credentials.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" and then "New Project"
3. Enter your project name (e.g., "notes-do-app")
4. Click "Create"

## Step 2: Enable Google Drive API

1. In your Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"

## Step 3: Create Service Account Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Enter service account details:
   - Name: `notes-do-service`
   - Service account ID: `notes-do-service`
   - Description: `Service account for Notes-Do app file uploads`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 4: Generate Service Account Key

1. In the "Credentials" page, find your service account
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Click "Create"
7. A JSON file will be downloaded - keep it secure!

## Step 5: Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder called "Notes-Do-Uploads" (or your preferred name)
3. Right-click the folder and select "Share"
4. Add your service account email (from step 3) with "Editor" permissions
5. Copy the folder ID from the URL (e.g., `https://drive.google.com/drive/folders/{FOLDER_ID}`)

## Step 6: Environment Variables Setup

Add these variables to your `.env` file in the backend directory:

```env
# Google Drive API Configuration
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here

# Service Account Credentials (from downloaded JSON)
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=your-project-id

# Optional: Custom folder name for organization
DRIVE_FOLDER_NAME=Notes-Do-Uploads
```

## Step 7: Format Private Key

The `GOOGLE_PRIVATE_KEY` needs special formatting:
1. Copy the entire private key from the JSON file (including BEGIN/END lines)
2. Replace all `\n` with actual newlines
3. Wrap the entire key in quotes in the .env file

Example format:
```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...your key content here...
-----END PRIVATE KEY-----"
```

## Step 8: Test Setup

Once you've added the environment variables, restart your server:

```bash
npm run dev
```

## Security Notes

1. **Never commit your service account JSON file to version control**
2. **Add the JSON file to your `.gitignore`**
3. **Keep your private key secure and rotate it regularly**
4. **Use environment variables for all sensitive data**

## Troubleshooting

### Common Issues:

1. **"Invalid credentials" error**
   - Check if the service account email is correct
   - Verify the private key format (newlines are important)
   - Ensure the service account has access to the Drive folder

2. **"Folder not found" error**
   - Verify the folder ID is correct
   - Check if the service account has permission to access the folder

3. **"API not enabled" error**
   - Make sure Google Drive API is enabled in Google Cloud Console

### Testing API Connection:

You can test the connection by making a POST request to `/api/notes/upload` with a PDF file and proper authentication headers.

## Required Environment Variables Summary

```env
# Required for Google Drive integration
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_CLIENT_EMAIL=notes-do-service@project-123456.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_PROJECT_ID=project-123456

# Optional
DRIVE_FOLDER_NAME=Notes-Do-Uploads
```

Once these are set up, your notes upload functionality will work with automatic Google Drive integration!