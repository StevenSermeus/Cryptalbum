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

  share: protectedProcedure
    .input(
      z.object({
        albumId: z.string(),
        sharedAlbumWithDevice: z.array(
          z.object({
            deviceId: z.string(),
            encryptedAlbumName: z.string(),
          }),
        ),
        sharedPictures: z.array(
          z.array(
            z.object({
              deviceId: z.string(),
              pictureId: z.string(),
              key: z.string(),
            }),
          ),
        ),
      }),
    )
    .use(rateLimitedMiddleware)
    .mutation(async ({ ctx, input }) => {
      try {
        logger.info(
          `Starting the album share process by ${ctx.session.userId} for album ${input.albumId}`,
        );
        const album = await ctx.db.album.findUnique({
          where: { id: input.albumId },
          select: { userId: true },
        });

        if (!album || album.userId !== ctx.session.userId) {
          !album
            ? logger.warn(`Album ${input.albumId} not found to share`)
            : logger.warn(
              `User ${ctx.session.userId} is not the owner of the album ${input.albumId}`,
            );
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You are not the owner of this album or the album does not exist.",
          });
        }
        const deviceIds = input.sharedAlbumWithDevice.map((s) => s.deviceId);
        const devices = await ctx.db.userDevice.findMany({
          where: {
            id: {
              in: deviceIds,
            },
          },
        });
        if (devices.length !== deviceIds.length) {
          const foundIds = new Set(devices.map((d) => d.id));
          const missingIds = deviceIds.filter((id) => !foundIds.has(id));
          logger.warn(`Some devices were not found: ${missingIds}`);
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Devices with IDs ${missingIds.join(", ")} do not exist.`,
          });
        }
        await ctx.db.$transaction(async (t) => {
          for (const sharedAlbum of input.sharedAlbumWithDevice) {
            await t.sharedAlbum.create({
              data: {
                deviceId: sharedAlbum.deviceId,
                albumId: input.albumId,
                albumName: sharedAlbum.encryptedAlbumName,
              },
            });
          }
          for (const sharedPicturesPerDevice of input.sharedPictures) {
            for (const picture of sharedPicturesPerDevice) {
              await t.sharedPicture.create({
                data: {
                  deviceId: picture.deviceId,
                  pictureId: picture.pictureId,
                  key: picture.key,
                },
              });
            }
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
          album: true,
        },
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
          albumId: true,
        },
      });
      if (!sharedAlbums) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return sharedAlbums;
    }),

  userDevicesOfAlbumWithoutAccessToPicture: protectedProcedure
    .input(
      z.object({
        albumId: z.string(),
        pictureId: z.string(),
      }),
    )
    .use(rateLimitedMiddleware)
    .mutation(async ({ ctx, input }) => {
      logger.info(
        `Getting user devices associated with album ${input.albumId} who don't have access to picture ${input.pictureId} for user ${ctx.session.userId}`,
      );
      const album = await ctx.db.album.findUnique({
        where: { id: input.albumId },
        select: { userId: true },
      });

      if (!album || album.userId !== ctx.session.userId) {
        !album
          ? logger.warn(`Album ${input.albumId} not found`)
          : logger.warn(
            `User ${ctx.session.userId} is not the owner of the album ${input.albumId}`,
          );
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You are not the owner of this album or the album does not exist.",
        });
      }
      const devicesOfAlbumWithoutSharedPicture =
        await ctx.db.userDevice.findMany({
          where: {
            sharedAlbums: {
              some: {
                albumId: input.albumId,
              },
            },
            sharedPictures: {
              none: {
                pictureId: input.pictureId,
              },
            },
          },
          select: {
            id: true,
            publicKey: true,
          },
        });
      const devices = devicesOfAlbumWithoutSharedPicture.map((sa) => ({
        deviceId: sa.id,
        publicKey: sa.publicKey,
      }));
      return devices;
    }),
});
