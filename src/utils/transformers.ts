import { ValueTransformer } from 'typeorm';

/** Postgres `bigint` columns come back as strings from the driver — coerce to number. */
export const bigintTransformer: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseInt(value, 10),
};
