import Joi from 'joi';
import { VideoCategory } from '../entities/Video.entity';

const categories = Object.values(VideoCategory);

export const listVideosQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('recent', 'popular').default('recent'),
  search: Joi.string().trim().min(1).max(200),
});

export const videoIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const recommendedQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
});

export const createVideoSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow('').max(5000).required(),
  category: Joi.string()
    .valid(...categories)
    .default(VideoCategory.OTHER),
  videoKey: Joi.string().required(),
  thumbnailKey: Joi.string().required(),
});

export const updateVideoSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().allow('').max(5000),
  category: Joi.string().valid(...categories),
  thumbnailKey: Joi.string(),
}).min(1);

export const reactionSchema = Joi.object({
  type: Joi.string().valid('LIKE', 'DISLIKE').required(),
});
