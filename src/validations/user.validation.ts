import Joi from 'joi';

export const updateMeSchema = Joi.object({
  channelName: Joi.string().min(2).max(100),
  avatarUrl: Joi.string().uri().allow(null),
}).min(1);

export const userIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});
