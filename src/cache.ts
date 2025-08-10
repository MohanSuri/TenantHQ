import { createClient } from 'redis';
import {config} from '@config/config';

export const setupRedis = () => {
    if (config.NODE_ENV === 'development') {
        return setupRedisClientForDevelopment();
    }
}

const setupRedisClientForDevelopment = async () => {
    const redisClient = createClient({
        url: config.REDIS_CONNECTION_STRING,
    });

    redisClient.on('error', (err) => {
        console.error('Redis Client Error', err);
    });

    await redisClient.connect();
    return redisClient;
}

export const redisClient = setupRedis();