import Joi from 'joi';

export const presignThumbnailSchema = Joi.object({
  fileName: Joi.string().required(),
  contentType: Joi.string().valid('image/jpeg', 'image/png', 'image/webp').required(),
});

export const initiateVideoUploadSchema = Joi.object({
  fileName: Joi.string().required(),
  fileSize: Joi.number().integer().positive().required(),
  contentType: Joi.string().valid('video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska').required(),
});

export const uploadSessionIdParamSchema = Joi.object({
  uploadId: Joi.string().uuid().required(),
});

export const presignPartsSchema = Joi.object({
  partNumbers: Joi.array().items(Joi.number().integer().min(1).max(10000)).min(1).required(),
});

export const completeUploadSchema = Joi.object({
  parts: Joi.array()
    .items(
      Joi.object({
        partNumber: Joi.number().integer().min(1).required(),
        eTag: Joi.string().required(),
      })
    )
    .min(1)
    .required(),
});
