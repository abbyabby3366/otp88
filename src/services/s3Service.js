const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const {
  S3_ENDPOINT_URL,
  S3_REGION_NAME,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET_NAME
} = require('../config/constants');

let s3ClientInstance = null;

function getS3Client() {
  if (!s3ClientInstance && S3_ACCESS_KEY && S3_SECRET_KEY) {
    s3ClientInstance = new S3Client({
      endpoint: S3_ENDPOINT_URL,
      region: S3_REGION_NAME,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY
      },
      forcePathStyle: true
    });
  }
  return s3ClientInstance;
}

/**
 * Uploads a buffer to S3 with public-read ACL and returns the direct public URL.
 */
async function uploadBufferToS3({ buffer, key, contentType = 'application/octet-stream' }) {
  const client = getS3Client();
  if (!client) {
    throw new Error('S3 Object Storage is not configured with access credentials.');
  }

  const cleanKey = key.replace(/^\/+/, '');
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: cleanKey,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read'
  });

  await client.send(command);

  // Path-style public URL: https://<region>.linodeobjects.com/<bucket>/<key>
  const endpointClean = S3_ENDPOINT_URL.replace(/\/+$/, '');
  const publicUrl = `${endpointClean}/${S3_BUCKET_NAME}/${cleanKey}`;
  return publicUrl;
}

module.exports = {
  getS3Client,
  uploadBufferToS3,
  S3_BUCKET_NAME
};
