import Joi from 'joi';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('USER', 'ADMIN').default('USER'),
});

export const viewsByDayQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
});
