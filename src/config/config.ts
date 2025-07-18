import dotenv from 'dotenv';
dotenv.config();
import { envSchema } from "./schema";
import logger from '@utils/logger';

const parsed = envSchema.safeParse(process.env);

if (!parsed.success){
    logger.error(`Invalid Env variables ${parsed.error}`)
    process.exit(1);
}

export const config = parsed.data;