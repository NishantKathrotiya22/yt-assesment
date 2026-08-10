import { uploadSessionRepository } from '../repositories/upload-session.repository';
import { UploadSession, UploadSessionStatus } from '../entities/UploadSession.entity';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import * as s3 from '../utils/s3.util';

const BYTES_PER_MB = 1024 * 1024;
const S3_MAX_PARTS = 10000;

export async function presignThumbnail(fileName: string, contentType: string) {
  return s3.presignPutObject('thumbnails', fileName, contentType);
}

export async function initiateVideoUpload(ownerId: string, fileName: string, fileSize: number, contentType: string) {
  const maxBytes = env.MAX_VIDEO_SIZE_MB * BYTES_PER_MB;
  if (fileSize > maxBytes) throw new ApiError('FILE_TOO_LARGE');

  const partSizeBytes = env.UPLOAD_PART_SIZE_MB * BYTES_PER_MB;
  const totalParts = Math.ceil(fileSize / partSizeBytes);
  if (totalParts > S3_MAX_PARTS) throw new ApiError('FILE_TOO_LARGE');

  const { key, uploadId } = await s3.createMultipartUpload(fileName, contentType);

  const session = await uploadSessionRepository.create({
    ownerId,
    s3Key: key,
    s3UploadId: uploadId,
    fileName,
    fileSize,
    contentType,
    partSize: partSizeBytes,
    totalParts,
    status: UploadSessionStatus.INITIATED,
  });

  return { uploadId: session.id, key, partSize: partSizeBytes, totalParts };
}

async function getOwnedSession(uploadId: string, ownerId: string): Promise<UploadSession> {
  const session = await uploadSessionRepository.findById(uploadId);
  if (!session || session.ownerId !== ownerId) throw new ApiError('UPLOAD_SESSION_NOT_FOUND');
  return session;
}

export async function presignParts(uploadId: string, ownerId: string, partNumbers: number[]) {
  const session = await getOwnedSession(uploadId, ownerId);
  if (session.status !== UploadSessionStatus.INITIATED) throw new ApiError('UPLOAD_SESSION_INVALID_STATE');

  const outOfRange = partNumbers.some((n) => n > session.totalParts);
  if (outOfRange) throw new ApiError('UPLOAD_PART_MISMATCH');

  return Promise.all(
    partNumbers.map(async (partNumber) => ({
      partNumber,
      url: await s3.presignUploadPart(session.s3Key, session.s3UploadId, partNumber),
    }))
  );
}

export async function listUploadedParts(uploadId: string, ownerId: string) {
  const session = await getOwnedSession(uploadId, ownerId);
  return s3.listUploadedParts(session.s3Key, session.s3UploadId);
}

export async function completeUpload(uploadId: string, ownerId: string, parts: { partNumber: number; eTag: string }[]) {
  const session = await getOwnedSession(uploadId, ownerId);
  if (session.status !== UploadSessionStatus.INITIATED) throw new ApiError('UPLOAD_SESSION_INVALID_STATE');
  if (parts.length !== session.totalParts) throw new ApiError('UPLOAD_PART_MISMATCH');

  await s3.completeMultipartUpload(session.s3Key, session.s3UploadId, parts);
  await uploadSessionRepository.updateStatus(session.id, UploadSessionStatus.COMPLETED);

  return { videoKey: session.s3Key };
}

export async function abortUpload(uploadId: string, ownerId: string): Promise<void> {
  const session = await getOwnedSession(uploadId, ownerId);
  if (session.status !== UploadSessionStatus.INITIATED) throw new ApiError('UPLOAD_SESSION_INVALID_STATE');

  await s3.abortMultipartUpload(session.s3Key, session.s3UploadId);
  await uploadSessionRepository.updateStatus(session.id, UploadSessionStatus.ABORTED);
}
