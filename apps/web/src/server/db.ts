import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";
import { env } from "@/env";
import { Client } from "minio";

const createPrismaClient = () =>
  new PrismaClient({
    log: env.NODE_ENV === "development" ? [] : ["error"],
  });
//eslint-disable-next-line no-undef
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

const createCacheClient = () => {
  const client = createClient({
    socket: {
      host: env.REDIS_URL,
    },
  });
  client.on("error", (error) => {
    console.error("Valkey error: ", error);
  });
  client.connect().then(() => {
    console.log("Connected to Valkey");
  });
  client.on("connect", () => {
    console.log("Connected to Valkey");
  });
  return client;
};

//eslint-disable-next-line no-undef
const globalForCache = globalThis as unknown as {
  cache: ReturnType<typeof createCacheClient> | undefined;
};

export const cache = globalForCache.cache ?? createCacheClient();

const createMinioClient = () => {
  const minio = new Client({
    endPoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
    region: "eu-west-1",
  });
  //create bucket if it doesn't exist
  minio.bucketExists("pictures", (err, exists) => {
    if (err) {
      console.error("Error checking if bucket exists", err);
    }
    if (!exists) {
      minio.makeBucket("pictures", (err) => {
        if (err) {
          console.error("Error creating bucket", err);
        }
      });
    }
  });
  return minio;
};

export const minio = createMinioClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

if (env.NODE_ENV !== "production") globalForCache.cache = cache;
