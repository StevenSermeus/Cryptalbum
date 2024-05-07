import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  rateLimitedMiddleware,
} from "@/server/api/trpc";
import logger from "@/utils/logger";

export const albumRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        keys_user_device: z.array(
          z.object({
            deviceId: z.string(),
            encryptedAlbumName: z.string(),
          }),
        ),
      }),
    )
    .use(rateLimitedMiddleware)
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.$transaction(async (t) => {
          const album = await t.album.create({
            data: {
              owner: {
                connect: {
                  id: ctx.session.userId,
                },
              },
            },
          });

          for (const userDevice of input.keys_user_device) {
            await t.sharedAlbum.create({
              data: {
                deviceId: userDevice.deviceId,
                albumId: album.id,
                albumName: userDevice.encryptedAlbumName,
              },
            });
          }
        });
      } catch (e) {
        logger.error(
          `Failed to create album for user ${ctx.session.userId} with error: ${e}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create album. Please try again.",
        });
      }
    }),

  getAll: protectedProcedure
    .use(rateLimitedMiddleware)
    .query(async ({ ctx }) => {
      logger.info(`Getting albums for deviceId ${ctx.session.user.id}`);
      const sharedAlbums = await ctx.db.sharedAlbum.findMany({
        where: {
          deviceId: ctx.session.user.id,
        },
        include: {
          album: true
        }
      });
      if (!sharedAlbums) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return sharedAlbums;
    }),

  getSharedAlbums: protectedProcedure
    .use(rateLimitedMiddleware)
    .query(async ({ ctx }) => {
      logger.info(`Getting shared albums for deviceId ${ctx.session.user.id}`);
      const sharedAlbums = await ctx.db.sharedAlbum.findMany({
        where: {
          deviceId: ctx.session.user.id,
        },
        select: {
          albumName: true,
          albumId: true
        }
      });
      if (!sharedAlbums) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return sharedAlbums;
    }),
});
