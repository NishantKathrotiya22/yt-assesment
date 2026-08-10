import Joi from 'joi';

export const listCommentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const createCommentSchema = Joi.object({
  text: Joi.string().min(1).max(2000).required(),
});

export const commentIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});
