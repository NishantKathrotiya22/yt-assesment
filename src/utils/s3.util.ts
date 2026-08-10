import { randomUUID } from 'crypto';
import {
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/s3';
import { env } from '../config/env';
import { ApiError } from './ApiError';

export interface UploadedPart {
  partNumber: number;
  eTag: string;
  size?: number;
}

function buildKey(prefix: string, fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  return `${prefix}/${randomUUID()}-${sanitized}`;
}

export async function presignPutObject(prefix: string, fileName: string, contentType: string) {
  const key = buildKey(prefix, fileName);
  try {
    const command = new PutObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3Client, command, { expiresIn: env.PRESIGNED_URL_EXPIRES_IN_SECONDS });
    return { key, url };
  } catch {
    throw new ApiError('S3_OPERATION_FAILED');
  }
}

export async function createMultipartUpload(fileName: string, contentType: string) {
  const key = buildKey('videos', fileName);
  try {
    const result = await s3Client.send(
      new CreateMultipartUploadCommand({ Bucket: env.AWS_S3_BUCKET, Key: key, ContentType: contentType })
    );
    if (!result.UploadId) throw new Error('S3 did not return an UploadId');
    return { key, uploadId: result.UploadId };
  } catch {
    throw new ApiError('S3_OPERATION_FAILED');
  }
}

export async function presignUploadPart(key: string, uploadId: string, partNumber: number): Promise<string> {
  try {
    const command = new UploadPartCommand({ Bucket: env.AWS_S3_BUCKET, Key: key, UploadId: uploadId, PartNumber: partNumber });
    return await getSignedUrl(s3Client, command, { expiresIn: env.PRESIGNED_URL_EXPIRES_IN_SECONDS });
  } catch {
    throw new ApiError('S3_OPERATION_FAILED');
  }
}

export async function listUploadedParts(key: string, uploadId: string): Promise<UploadedPart[]> {
  try {
    const result = await s3Client.send(new ListPartsCommand({ Bucket: env.AWS_S3_BUCKET, Key: key, UploadId: uploadId }));
    return (result.Parts ?? [])
      .filter((p) => p.PartNumber != null && p.ETag != null)
      .map((p) => ({ partNumber: p.PartNumber as number, eTag: p.ETag as string, size: p.Size }));
  } catch {
    throw new ApiError('S3_OPERATION_FAILED');
  }
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { partNumber: number; eTag: string }[]
): Promise<void> {
  try {
    await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: [...parts]
            .sort((a, b) => a.partNumber - b.partNumber)
            .map((p) => ({ PartNumber: p.partNumber, ETag: p.eTag })),
        },
      })
    );
  } catch {
    throw new ApiError('S3_OPERATION_FAILED');
  }
}

export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  try {
    await s3Client.send(new AbortMultipartUploadCommand({ Bucket: env.AWS_S3_BUCKET, Key: key, UploadId: uploadId }));
  } catch {
    throw new ApiError('S3_OPERATION_FAILED');
  }
}
