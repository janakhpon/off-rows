# Testing S3 Sync API Endpoints with Postman

This guide explains how to test your S3 sync API endpoints using Postman.

---

## 1. Upload Image/File to S3

**Endpoint:**
```
POST http://localhost:3001/api/s3/upload
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw, JSON):**
```json
{
  "filename": "test-image.jpg",
  "data": "<BASE64_ENCODED_IMAGE_DATA>",
  "contentType": "image/jpeg"
}
```
- Replace `<BASE64_ENCODED_IMAGE_DATA>` with the base64 string of your image or file.
- You can use an online tool or the `base64` command to convert a file to base64.

**Example:**
```json
{
  "filename": "tiny.png",
  "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "contentType": "image/png"
}
```

---

## 2. Delete Image/File from S3

**Endpoint:**
```
DELETE http://localhost:3001/api/s3/delete
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw, JSON):**
```json
{
  "s3Key": "images/your_image_key.jpg"
}
```
- Use the S3 key (path) of the file you want to delete. This is usually the same as the `filename` you uploaded, or the S3 key returned by the upload endpoint.

---

## 3. Check S3 Configuration Status

**Endpoint:**
```
GET http://localhost:3001/api/s3/status
```

**No body needed.**

**Response Example:**
```json
{
  "configured": true,
  "hasRegion": true,
  "hasAccessKey": true,
  "hasSecretKey": true,
  "hasBucket": true
}
```

---

## 4. How to Get Base64 from an Image/File (CLI Example)

```bash
base64 -w 0 your-image.jpg
```
- Copy the output and paste it into the `data` field in Postman.

---

## 5. What to Expect

- **Upload:** Should return `{ success: true, filename, s3Url, message }`
- **Delete:** Should return `{ success: true, deletedKey, message }`
- **Status:** Should return `{ configured: true, ... }`

---

## 6. Troubleshooting

- If you get a 500 error, check your backend logs for details.
- If you get a CORS error, make sure you’re using Postman (not browser fetch/XHR).
- If upload succeeds, check your S3 bucket for the file.

---

## 7. Ready-to-Import Postman Collection

You can create a Postman collection with the above requests for easy reuse. If you need a ready-to-import JSON file, let the team know!
