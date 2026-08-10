import Joi from 'joi';

export const updateMeSchema = Joi.object({
  channelName: Joi.string().min(2).max(100),
  avatarKey: Joi.string().allow(null),
}).min(1);

export const userIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});
