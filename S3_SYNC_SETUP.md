# Secure S3 Sync Setup

This guide explains how to set up secure S3 image synchronization for the Offrows application.

## Overview

The S3 sync feature has been redesigned for security:
- **Frontend**: No longer contains AWS credentials
- **Backend**: Handles all S3 operations securely
- **API**: Secure endpoints for image uploads

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
```bash
# Run the setup script
./setup-env.sh

# Or manually create .env file
cp env.example .env
```

Edit `backend/.env` with your AWS credentials:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/express_rest_starter
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_BUCKET_NAME=your_bucket_name
```

### 3. Start Backend Server
```bash
npm run dev
```

The backend will be available at `http://localhost:3000`

## Frontend Setup

### 1. Configure API URL
Add to your frontend `.env` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Remove Old AWS Credentials
Remove these from your frontend `.env`:
- `NEXT_PUBLIC_AWS_REGION`
- `NEXT_PUBLIC_AWS_ACCESS_KEY_ID`
- `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_AWS_BUCKET_NAME`

## API Endpoints

### Upload Image to S3
```
POST /api/s3/upload
Content-Type: application/json

{
  "filename": "image.jpg",
  "data": "base64_encoded_image_data",
  "contentType": "image/jpeg" // optional
}
```

### Check S3 Configuration
```
GET /api/s3/status
```

## Testing the Setup

### 1. Check Backend Status
```bash
curl http://localhost:3000/api/s3/status
```

### 2. Test Image Upload
```bash
curl -X POST http://localhost:3000/api/s3/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.jpg",
    "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
  }'
```

## Security Benefits

1. **No Credentials in Frontend**: AWS credentials are only on the server
2. **Server-Side Validation**: All uploads are validated on the backend
3. **Rate Limiting**: Built-in protection against abuse
4. **Error Handling**: Proper error responses without exposing internals

## Troubleshooting

### Backend Won't Start
- Check that all environment variables are set
- Ensure AWS credentials are valid
- Verify the bucket exists and is accessible

### Upload Fails
- Check browser console for API errors
- Verify backend is running on correct port
- Ensure CORS is properly configured

### S3 Configuration Issues
- Use the `/api/s3/status` endpoint to check configuration
- Verify AWS credentials have S3 upload permissions
- Check bucket name and region match

## Development Workflow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Enable S3 sync in the app
4. Add images to test the sync functionality

The sync will now work securely through the backend API! 