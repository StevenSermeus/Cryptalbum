import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "../trpc";
import { rateLimitedMiddleware } from "../trpc";
import { protectedProcedure } from "../trpc";
import { z } from "zod";
import logger from "@/utils/logger";

export const deviceRouter = createTRPCRouter({
  listDevices: protectedProcedure
    .use(rateLimitedMiddleware)
    .query(async ({ ctx }) => {
      const data = await ctx.db.userDevice.findMany({
        where: { userId: ctx.session.userId },
        orderBy: { createdAt: "desc" },
      });
      return data;
    }),
  trustDevice: protectedProcedure
    .use(rateLimitedMiddleware)
    .input(
      z.object({
        deviceId: z.string(),
        keys: z.array(
          z.object({
            key: z.string(),
            id: z.string(),
          }),
        ),
        albumsForDevice: z.array(
          z.object({
            albumId: z.string(),
            albumName: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input: { deviceId, keys, albumsForDevice }, ctx }) => {
      try {
        logger.info(
          `Trust device request for device ${deviceId} by user ${ctx.session.userId}`,
        );
        await ctx.db.$transaction(async (t) => {
          const device = await t.userDevice.findFirst({
            where: { id: deviceId, userId: ctx.session.userId },
          });
          if (!device) {
            throw new TRPCError({ code: "BAD_REQUEST" });
          }
          if (device.isTrusted) {
            logger.error(
              `Trust device request for device ${deviceId} by user ${ctx.session.userId} already Trusted`,
            );
            throw new TRPCError({ code: "BAD_REQUEST" });
          }
          const deviceKeys = await t.sharedPicture.findMany({
            where: { user_device: { id: ctx.session.user.id } },
            select: { id: true, picture: { select: { id: true } } },
          });
          const deviceKeysMap = new Map(
            deviceKeys.map((k) => [k.id, k.picture.id]),
          );
          for (const key of keys) {
            if (!deviceKeysMap.has(key.id)) {
              logger.error(
                `Trust device request for device ${deviceId} by user ${ctx.session.userId} key ${key.id} not found`,
              );
              throw new TRPCError({ code: "BAD_REQUEST" });
            }
            await t.sharedPicture.create({
              data: {
                user_device: {
                  connect: {
                    id: deviceId,
                  },
                },
                picture: {
                  connect: {
                    id: deviceKeysMap.get(key.id),
                  },
                },
                key: key.key,
              },
            });
          }
          const deviceAlbums = await t.sharedAlbum.findMany({
            where: { user_device: { id: ctx.session.user.id } },
            select: { id: true, albumId: true },
          });
          const deviceAlbumsMap = new Map(
            deviceAlbums.map((a) => [a.albumId, a.id]),
          );
          for (const album of albumsForDevice) {
            if (!deviceAlbumsMap.has(album.albumId)) {
              logger.error(
                `Trust device request for device ${deviceId} by user ${ctx.session.userId} album ${album.albumId} not found`,
              );
              throw new TRPCError({ code: "BAD_REQUEST" });
            }
            await t.sharedAlbum.create({
              data: {
                albumName: album.albumName,
                user_device: {
                  connect: {
                    id: deviceId,
                  },
                },
                album: {
                  connect: {
                    id: album.albumId,
                  },
                },
              },
            });
          }
          await t.userDevice.update({
            where: { id: deviceId },
            data: { isTrusted: true },
          });
          logger.info(
            `Trust device request for device ${deviceId} by user ${ctx.session.userId} SUCCESS`,
          );
        });
      } catch (e) {
        console.log(e);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
  revokeDevice: protectedProcedure
    .use(rateLimitedMiddleware)
    .input(
      z.object({
        deviceId: z.string(),
      }),
    )
    .mutation(async ({ input: { deviceId }, ctx }) => {
      logger.info(
        `Revoking Trust Device request for device ${deviceId} by user ${ctx.session.userId}`,
      );
      const device = await ctx.db.userDevice.findFirst({
        where: { id: deviceId, userId: ctx.session.userId },
      });
      if (!device) {
        logger.error(
          `Revoking Trust Device request for device ${deviceId} by user ${ctx.session.userId} DEVICE NOT FOUND`,
        );
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      if (!device.isTrusted) {
        logger.error(
          `Revoking Trust Device request for device ${deviceId} by user ${ctx.session.userId} DEVICE ALREADY NOT TRUSTED`,
        );
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      await ctx.db.$transaction(async (t) => {
        await ctx.db.userDevice.update({
          where: { id: deviceId },
          data: { isTrusted: false },
        });
        await t.sharedPicture.deleteMany({
          where: { user_device: { id: deviceId } },
        });
        await t.sharedAlbum.deleteMany({
          where: { deviceId: deviceId },
        });
        logger.info(
          `Revoking Trust Device request for device ${deviceId} by user ${ctx.session.userId} SUCCESS`,
        );
      });
    }),
});
