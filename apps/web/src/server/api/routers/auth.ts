import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  rateLimitedMiddleware,
} from "@/server/api/trpc";
import { importRsaPublicKey, encrypt, decrypt } from "@/utils/crypto";
import { randomBytes } from "crypto";
export const authRouter = createTRPCRouter({
  createAccount: publicProcedure
    .use(rateLimitedMiddleware)
    .input(
      z.object({
        email: z.string().email(),
        publicKey: z.string(),
        deviceName: z.string(),
        name: z.string(),
      }),
    )
    .mutation(
      async ({ input: { email, publicKey, deviceName, name }, ctx }) => {
        try {
          const userExists = await ctx.db.user.findUnique({
            where: { email },
          });
          if (userExists) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "User already exists",
            });
          }
          const user = await ctx.db.user.create({
            data: {
              email,
              name,
              devices: {
                create: {
                  name: deviceName,
                  publicKey,
                },
              },
            },
          });
          return user;
        } catch (error) {
          console.error(error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create account",
          });
        }
      },
    ),
  challenge: publicProcedure
    .input(
      z.object({
        publicKey: z.string(),
      }),
    )
    .mutation(async ({ input: { publicKey }, ctx }) => {
      const userDevice = await ctx.db.userDevice.findUnique({
        where: { publicKey },
      });
      if (!userDevice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Device not found",
        });
      }
      const currentChallenge = await ctx.db.userDeviceChallenge.findFirst({
        where: {
          userDevice: {
            publicKey,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      const key = await importRsaPublicKey(userDevice.publicKey);
      if (currentChallenge?.expires && currentChallenge.expires > new Date()) {
        return {
          challengerId: currentChallenge.id,
          challenge: await encrypt(key, currentChallenge.challenge),
        };
      }
      const challenge = [...Array(32)]
        .map(() => Math.random().toString(36)[2])
        .join("");
      const deviceChallenge = await ctx.db.userDeviceChallenge.create({
        data: {
          challenge,
          expires: new Date(Date.now() + 1000 * 60 * 5),
          userDevice: {
            connect: {
              publicKey,
            },
          },
        },
      });
      const encryptedChallenge = await encrypt(key, challenge);
      return {
        challengerId: deviceChallenge.id,
        challenge: encryptedChallenge,
      };
    }),
});
