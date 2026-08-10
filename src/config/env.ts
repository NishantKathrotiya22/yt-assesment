import 'dotenv/config';
import Joi from 'joi';

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(4000),

  DATABASE_URL: Joi.string().uri().required(),
  DATABASE_URL_UNPOOLED: Joi.string().uri().optional(),

  ACCESS_TOKEN_SECRET: Joi.string().min(16).required(),
  ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_SECRET: Joi.string().min(16).required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),

  AWS_REGION: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  PRESIGNED_URL_EXPIRES_IN_SECONDS: Joi.number().default(900),

  MAX_VIDEO_SIZE_MB: Joi.number().default(2048),
  UPLOAD_PART_SIZE_MB: Joi.number().default(8),

  SEED_ADMIN_EMAIL: Joi.string().email().required(),
  SEED_ADMIN_PASSWORD: Joi.string().min(8).required(),
  SEED_ADMIN_NAME: Joi.string().default('Admin'),
})
  .unknown(true)
  .required();

const { value, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Invalid environment configuration: ${error.message}`);
}

export const env = {
  NODE_ENV: value.NODE_ENV as 'development' | 'test' | 'production',
  PORT: value.PORT as number,
  isProduction: value.NODE_ENV === 'production',

  DATABASE_URL: value.DATABASE_URL as string,
  DATABASE_URL_UNPOOLED: (value.DATABASE_URL_UNPOOLED ?? value.DATABASE_URL) as string,

  ACCESS_TOKEN_SECRET: value.ACCESS_TOKEN_SECRET as string,
  ACCESS_TOKEN_EXPIRES_IN: value.ACCESS_TOKEN_EXPIRES_IN as string,
  REFRESH_TOKEN_SECRET: value.REFRESH_TOKEN_SECRET as string,
  REFRESH_TOKEN_EXPIRES_IN: value.REFRESH_TOKEN_EXPIRES_IN as string,

  AWS_REGION: value.AWS_REGION as string,
  AWS_S3_BUCKET: value.AWS_S3_BUCKET as string,
  AWS_ACCESS_KEY_ID: value.AWS_ACCESS_KEY_ID as string,
  AWS_SECRET_ACCESS_KEY: value.AWS_SECRET_ACCESS_KEY as string,
  PRESIGNED_URL_EXPIRES_IN_SECONDS: value.PRESIGNED_URL_EXPIRES_IN_SECONDS as number,

  MAX_VIDEO_SIZE_MB: value.MAX_VIDEO_SIZE_MB as number,
  UPLOAD_PART_SIZE_MB: value.UPLOAD_PART_SIZE_MB as number,

  SEED_ADMIN_EMAIL: value.SEED_ADMIN_EMAIL as string,
  SEED_ADMIN_PASSWORD: value.SEED_ADMIN_PASSWORD as string,
  SEED_ADMIN_NAME: value.SEED_ADMIN_NAME as string,
};
