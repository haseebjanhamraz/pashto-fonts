import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_REGION = process.env.S3_REGION || "auto";
const S3_BUCKET = process.env.S3_BUCKET || "pashto-fonts";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "minio";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "minio123";
const S3_PUBLIC_BASE_URL =
  process.env.S3_PUBLIC_BASE_URL || "http://localhost:9000/pashto-fonts";

export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

/**
 * Extract the S3 object key from a stored fileUrl.
 * e.g. "http://localhost:9000/pashto-fonts/fonts/my-font/web-400-regular.woff2"
 *   -> "fonts/my-font/web-400-regular.woff2"
 *
 * Strips both the public base URL prefix AND any other http://host:port/bucket/ prefix
 * so the function is robust to hostname mismatches between worker and API environments.
 */
export function extractS3Key(fileUrl: string): string {
  // Try stripping the configured public base URL first
  if (fileUrl.startsWith(S3_PUBLIC_BASE_URL)) {
    return fileUrl.slice(S3_PUBLIC_BASE_URL.length).replace(/^\//, "");
  }

  // Fallback: strip everything up to and including the bucket name
  // Pattern: http://any-host:port/bucket-name/rest-of-key
  const bucketPattern = new RegExp(`^https?://[^/]+/${S3_BUCKET}/`);
  const stripped = fileUrl.replace(bucketPattern, "");
  if (stripped !== fileUrl) return stripped; // matched

  // Last resort: just return the URL path after the third slash segment
  try {
    const url = new URL(fileUrl);
    // pathname = "/bucket-name/fonts/..." -> remove leading /bucket/
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.slice(1).join("/"); // skip bucket name
  } catch {
    return fileUrl;
  }
}

/**
 * Fetch a file from S3/MinIO by its stored fileUrl.
 * Returns a Buffer or null on failure.
 */
export async function fetchFromS3(fileUrl: string): Promise<Buffer | null> {
  const key = extractS3Key(fileUrl);
  if (!key) return null;

  try {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    const response = await s3Client.send(command);

    if (!response.Body) return null;

    // response.Body is a Readable stream in Node.js
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  } catch (err) {
    console.error(`[S3] Failed to fetch key "${key}":`, err);
    return null;
  }
}
