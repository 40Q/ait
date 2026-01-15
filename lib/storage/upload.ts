import { SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKETS = {
  REQUEST_FILES: "request-files",
  DOCUMENTS: "documents",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export interface UploadResult {
  /** Storage path - store this in the database */
  path: string;
  /** File size in bytes */
  size: number;
  /** Bucket the file was uploaded to */
  bucket: StorageBucket;
}

export interface UploadOptions {
  bucket: StorageBucket;
  folder: string; // Usually company_id or job_id
  fileName?: string; // Optional custom file name
  contentType?: string;
}

/**
 * Generate a unique file name while preserving extension
 */
function generateFileName(originalName: string, customName?: string): string {
  const ext = originalName.split(".").pop() || "";
  const baseName = customName || originalName.replace(/\.[^/.]+$/, "");
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${baseName}-${timestamp}-${random}.${ext}`;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  supabase: SupabaseClient,
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const { bucket, folder, fileName, contentType } = options;
  const generatedName = generateFileName(file.name, fileName);
  const path = `${folder}/${generatedName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: contentType || file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return {
    path: data.path,
    size: file.size,
    bucket,
  };
}

/**
 * Upload multiple files to Supabase Storage
 */
export async function uploadFiles(
  supabase: SupabaseClient,
  files: File[],
  options: Omit<UploadOptions, "fileName">
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadFile(supabase, file, options);
    results.push(result);
  }

  return results;
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple files from Supabase Storage
 */
export async function deleteFiles(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

/**
 * Get a signed URL for a private file (if bucket is private)
 */
export async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600 // 1 hour default
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Extract path from a storage URL
 */
export function extractPathFromUrl(url: string, bucket: StorageBucket): string {
  const bucketPath = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(bucketPath);
  if (index === -1) {
    throw new Error("Invalid storage URL");
  }
  return url.substring(index + bucketPath.length);
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
