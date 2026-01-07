import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

export type QiniuUploadInput = {
  body: Buffer;
  contentType: string;
  keyPrefix?: string;
  extension: string;
};

export type QiniuUploadResult = {
  key: string;
  url: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getOptionalEnv(name: string) {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : null;
}

function joinUrl(base: string, key: string) {
  const b = base.replace(/\/+$/, "");
  const k = key.replace(/^\/+/, "");
  return `${b}/${k}`;
}

function buildKey(prefix: string, extension: string) {
  const date = new Date();
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const day = `${y}${m}${d}`;
  const id = crypto.randomUUID();
  const ext = extension.startsWith(".") ? extension.slice(1) : extension;
  return `${prefix}/${day}/${id}.${ext}`;
}

export function isQiniuConfigured() {
  const hasBaseUrl = Boolean(
    process.env.QINIU_PUBLIC_BASE_URL || process.env.QINIU_DOWNLOAD_BASE_URL,
  );
  return Boolean(
    process.env.QINIU_S3_ACCESS_KEY &&
      process.env.QINIU_S3_SECRET_KEY &&
      process.env.QINIU_S3_BUCKET &&
      process.env.QINIU_S3_ENDPOINT &&
      hasBaseUrl,
  );
}

export function isQiniuPrivateBucket() {
  return (getOptionalEnv("QINIU_BUCKET_PRIVATE") ?? "false") === "true";
}

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    // Keep padding to match Qiniu token format.
    ;
}

function getClient() {
  const accessKeyId = requireEnv("QINIU_S3_ACCESS_KEY");
  const secretAccessKey = requireEnv("QINIU_S3_SECRET_KEY");
  const endpoint = requireEnv("QINIU_S3_ENDPOINT");
  const region = getOptionalEnv("QINIU_S3_REGION") ?? "ap-southeast-1";
  const forcePathStyle = (getOptionalEnv("QINIU_S3_FORCE_PATH_STYLE") ?? "true") === "true";

  return new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function presignQiniuGetUrl(key: string) {
  const bucket = requireEnv("QINIU_S3_BUCKET");
  const ttl = Number(getOptionalEnv("QINIU_SIGNED_URL_TTL_SECONDS") ?? "3600");
  const expiresIn = Number.isFinite(ttl) && ttl > 0 && ttl <= 7 * 24 * 3600 ? ttl : 3600;

  const client = getClient();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(client, command, { expiresIn });
  return { url, expiresAt: Date.now() + expiresIn * 1000 };
}

export function getQiniuPublicUrlForKey(key: string) {
  const base =
    getOptionalEnv("QINIU_PUBLIC_BASE_URL") ?? requireEnv("QINIU_DOWNLOAD_BASE_URL");
  return joinUrl(base, key);
}

export function signQiniuPrivateDownloadUrlForKey(key: string) {
  const accessKey = requireEnv("QINIU_S3_ACCESS_KEY");
  const secretKey = requireEnv("QINIU_S3_SECRET_KEY");
  const base =
    getOptionalEnv("QINIU_DOWNLOAD_BASE_URL") ??
    getOptionalEnv("QINIU_PUBLIC_BASE_URL") ??
    "";
  if (!base) {
    throw new Error(
      "Missing environment variable: QINIU_DOWNLOAD_BASE_URL (or QINIU_PUBLIC_BASE_URL)",
    );
  }

  const ttl = Number(getOptionalEnv("QINIU_SIGNED_URL_TTL_SECONDS") ?? "3600");
  const expiresIn = Number.isFinite(ttl) && ttl > 0 && ttl <= 7 * 24 * 3600 ? ttl : 3600;
  const deadline = Math.floor(Date.now() / 1000) + expiresIn;

  const publicUrl = joinUrl(base, key);
  const urlToSign = `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}e=${deadline}`;

  const sign = crypto.createHmac("sha1", secretKey).update(urlToSign).digest();
  const encodedSign = base64UrlEncode(sign);
  const token = `${accessKey}:${encodedSign}`;
  const finalUrl = `${urlToSign}&token=${token}`;

  return { url: finalUrl, expiresAt: Date.now() + expiresIn * 1000 };
}

export async function signQiniuGetUrlForKey(key: string) {
  const explicit = getOptionalEnv("QINIU_SIGNING_MODE");
  const mode = (explicit ?? "").toLowerCase();
  if (mode === "s3") return presignQiniuGetUrl(key);
  if (mode === "qiniu") return signQiniuPrivateDownloadUrlForKey(key);

  // Auto mode:
  // - If you're using Qiniu's S3-compatible domains/endpoints, use SigV4 presigned URLs.
  // - Otherwise assume a Qiniu private download domain that supports ?e=...&token=...
  const base =
    getOptionalEnv("QINIU_DOWNLOAD_BASE_URL") ?? getOptionalEnv("QINIU_PUBLIC_BASE_URL") ?? "";
  if (base.includes("qiniucs.com") || base.includes(".s3.")) {
    return presignQiniuGetUrl(key);
  }
  return signQiniuPrivateDownloadUrlForKey(key);
}

export async function uploadToQiniuS3(input: QiniuUploadInput): Promise<QiniuUploadResult> {
  const bucket = requireEnv("QINIU_S3_BUCKET");
  const publicBase =
    getOptionalEnv("QINIU_PUBLIC_BASE_URL") ?? requireEnv("QINIU_DOWNLOAD_BASE_URL");
  const keyPrefix = input.keyPrefix ?? "girls";

  const key = buildKey(keyPrefix, input.extension);
  const client = getClient();

  const cacheControl =
    getOptionalEnv("QINIU_CACHE_CONTROL") ?? "public, max-age=31536000, immutable";

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: cacheControl,
    }),
  );

  return { key, url: joinUrl(publicBase, key) };
}
