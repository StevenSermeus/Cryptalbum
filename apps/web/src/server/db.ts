import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";
import { env } from "@/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
//eslint-disable-next-line no-undef
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

const createRedisClient = () => {
  const client = createClient();
  client.on("error", (error) => {
    console.error("Redis error: ", error);
  });
  client.connect().then(() => {
    console.log("Connected to Redis");
  });
  client.on("connect", () => {
    console.log("Connected to Redis");
  });
  return client;
};

//eslint-disable-next-line no-undef
const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createRedisClient> | undefined;
};

export const cache = globalForRedis.redis ?? createRedisClient();
