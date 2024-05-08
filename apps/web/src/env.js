import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL",
      ),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url(),
    ),
    VALKEY_URL: z.string(),
    VALKEY_PASSWORD: z.string(),
    RATE_LIMIT_WINDOW: z.number().default(60),
    RATE_LIMIT_MAX: z.number().default(1000),
    HMAC_SECRET: z.string(),
    MAX_FILE_SIZE_MB: z.number().default(50),
    MINIO_ACCESS_KEY: z.string(),
    MINIO_SECRET_KEY: z.string(),
    MINIO_USE_SSL: z.boolean().default(false),
    MINIO_PORT: z.number().default(9000),
    MINIO_ENDPOINT: z.string().default("localhost"),
    SEQ_URL: z.string(),
    LOGGER_SECRET: z.string().optional()
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_MAX_FILE_SIZE_MB: z.number().default(50),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    VALKEY_URL: process.env.VALKEY_URL,
    VALKEY_PASSWORD: process.env.VALKEY_PASSWORD,
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW ?? "60", 10),
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? "1000", 10),
    HMAC_SECRET: process.env.HMAC_SECRET,
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB ?? "50", 10),
    NEXT_PUBLIC_MAX_FILE_SIZE_MB: parseInt(
      process.env.MAX_FILE_SIZE_MB ?? "50",
      10,
    ),
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_USE_SSL: process.env.MINIO_USE_SSL === "true",
    MINIO_PORT: parseInt(process.env.MINIO_PORT ?? "9000", 10),
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    SEQ_URL: process.env.SEQ_URL,
    LOGGER_SECRET: process.env.LOGGER_SECRET,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
