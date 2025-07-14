#!/bin/bash

echo "Setting up backend environment for S3 sync..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp env.example .env
fi

echo ""
echo "Please update the following in your backend/.env file:"
echo ""
echo "AWS_REGION=your_aws_region"
echo "AWS_ACCESS_KEY_ID=your_access_key_id"
echo "AWS_SECRET_ACCESS_KEY=your_secret_access_key"
echo "AWS_BUCKET_NAME=your_bucket_name"
echo ""
echo "Example:"
echo "AWS_REGION=us-east-1"
echo "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE"
echo "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
echo "AWS_BUCKET_NAME=my-image-bucket"
echo ""
echo "After updating .env, start the backend with:"
echo "npm run dev"
echo ""
echo "The backend will be available at: http://localhost:3000"
echo "API endpoints:"
echo "  - POST /api/s3/upload - Upload image to S3"
echo "  - GET  /api/s3/status  - Check S3 configuration" 