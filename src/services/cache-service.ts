import { redisClient } from "@/cache";

export const cacheItem = async (key: string, value: string) => {
    const client = await redisClient;
    if (!client) throw new Error("Redis client is undefined");
    await client.set(key, value);
}

export const retrieveCachedItem = async (key: string) => {
    const client = await redisClient;
    if (!client) throw new Error("Redis client is undefined");
    const value = await client.get(key);
    return value;
}