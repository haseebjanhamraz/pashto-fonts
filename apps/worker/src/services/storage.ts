import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_REGION = process.env.S3_REGION || "auto";
const S3_BUCKET = process.env.S3_BUCKET || "pashto-fonts";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "minio";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "minio123";
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || "http://localhost:9000/pashto-fonts";

const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

let bucketChecked = false;

async function ensureBucketExists() {
  if (bucketChecked) return;
  try {
    // Check if the bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    bucketChecked = true;
  } catch (error: any) {
    // If bucket doesn't exist, create it
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      console.log(`[StorageService] Bucket '${S3_BUCKET}' does not exist. Creating it...`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
        bucketChecked = true;
        console.log(`[StorageService] Bucket '${S3_BUCKET}' created successfully.`);
      } catch (createErr) {
        console.error(`[StorageService] Failed to create bucket:`, createErr);
      }
    } else {
      console.error(`[StorageService] HeadBucketCommand error:`, error);
    }
  }
}

export class StorageService {
  /**
   * Upload a local file to S3-compatible storage.
   * Returns the public URL of the uploaded file.
   */
  static async uploadFile(localPath: string, s3Key: string, contentType: string): Promise<string> {
    await ensureBucketExists();
    const fileBuffer = fs.readFileSync(localPath);
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    
    // Construct the public URL
    // e.g. http://localhost:9000/pashto-fonts/fonts/my-font.woff2
    return `${S3_PUBLIC_BASE_URL}/${s3Key}`;
  }
}
