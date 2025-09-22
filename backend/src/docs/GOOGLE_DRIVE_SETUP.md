# Google Drive API Setup Guide

## Overview
This guide explains how to set up Google Drive API integration for the Notes-Do application to enable PDF file uploads and storage.

## Required Google Cloud Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your **Project ID**

### Step 2: Enable Google Drive API
1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on it and press **Enable**

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Configure OAuth consent screen if prompted:
   - Choose **External** user type
   - Fill in required fields (App name, User support email, Developer contact)
   - Add your domain to authorized domains
4. For Application type, select **Web application**
5. Add authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/google/callback
   http://localhost:5173/auth/callback
   ```
6. Download the credentials JSON file

### Step 4: Create Service Account (Alternative Method)
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service account**
3. Fill in service account details
4. Skip granting roles for now
5. Click **Create key** > **JSON**
6. Download the service account key file

## Environment Configuration

Add these variables to your `.env` file:

```env
# Google Drive API Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Google Service Account (alternative to OAuth2)
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/google-service-account-key.json

# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id_here
```

## Where to Get the Values

### Google Client ID & Secret
- From the OAuth 2.0 credentials you created in Step 3
- Found in the downloaded JSON file as `client_id` and `client_secret`

### Service Account Key File
- The JSON file downloaded in Step 4
- Place it in `backend/config/` directory
- Make sure the path matches `GOOGLE_SERVICE_ACCOUNT_KEY_FILE`

### Drive Folder ID (Optional)
1. Create a folder in Google Drive for storing uploaded notes
2. Right-click the folder > **Get link**
3. The folder ID is the last part of the URL:
   ```
   https://drive.google.com/drive/folders/1ABCDefGHijklMNopQRstUVwxyz123456
                                      ↑ This is the folder ID
   ```

## Authentication Methods

The application supports two authentication methods:

### Method 1: Service Account (Recommended for Development)
- Uses a service account to access a shared Drive
- Files are stored in the service account's Drive
- Simpler setup, no user consent required
- Good for development and testing

### Method 2: OAuth 2.0 User Authentication
- Uses user's personal Google Drive
- Requires user to grant permission
- Files stored in user's own Drive
- Better for production with user-owned storage

## File Permissions

### For Service Account Method:
1. Share the Drive folder with the service account email
2. Grant **Editor** access to the service account

### For OAuth 2.0 Method:
- Users will be prompted to grant Drive access when they first upload

## API Quotas and Limits

- **Queries per day**: 1,000,000,000
- **Queries per 100 seconds per user**: 1,000
- **Queries per 100 seconds**: 10,000

For production, you may need to request quota increases.

## Testing the Setup

1. Ensure all environment variables are set
2. Place the service account key file in the correct location
3. Start the backend server
4. Try uploading a PDF through the frontend
5. Check Google Drive to see if the file appears

## Security Considerations

1. **Never commit** the service account key file to version control
2. Add `google-service-account-key.json` to `.gitignore`
3. Use environment variables for all sensitive data
4. In production, use Google Cloud Secret Manager for credentials
5. Regularly rotate service account keys

## Troubleshooting

### Common Issues:

1. **"Service account key file not found"**
   - Check the file path in `GOOGLE_SERVICE_ACCOUNT_KEY_FILE`
   - Ensure the file exists and is readable

2. **"Access denied" errors**
   - Verify API is enabled in Google Cloud Console
   - Check service account permissions on Drive folder

3. **"Invalid credentials" errors**
   - Verify OAuth client ID and secret are correct
   - Check redirect URIs match exactly

4. **"Quota exceeded" errors**
   - Check API quotas in Google Cloud Console
   - Implement proper error handling and retry logic

## Production Setup

For production deployment:

1. Use Google Cloud Secret Manager for credentials
2. Set up proper IAM roles and permissions
3. Configure domain verification for OAuth
4. Implement proper error handling and monitoring
5. Set up backup and recovery procedures