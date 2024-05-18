import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import logger from "@/utils/logger";
import { rateLimitedMiddleware } from "@/server/api/trpc";
import { z } from "zod";

export const userRouter = createTRPCRouter({
  userDevice: protectedProcedure
    .use(rateLimitedMiddleware)
    .query(async ({ ctx }) => {
      logger.info(`Getting user devices for user ${ctx.session.userId}`);
      const userDevices = await ctx.db.userDevice.findMany({
        where: { userId: ctx.session.userId },
      });
      if (!userDevices) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return userDevices;
    }),
  getFriendWithDevices: protectedProcedure
    .input(z.string().email())
    .use(rateLimitedMiddleware)
    .mutation(async ({ ctx, input }) => {
      if (input === ctx.session.user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot perform this operation on your own account.",
        });
      }
      logger.info(`Getting user devices for friend with email ${input}`);
      const friend = await ctx.db.user.findUnique({
        where: {
          email: input,
        },
        include: {
          devices: {
            select: {
              id: true,
              publicKey: true,
            },
          },
        },
      });
      if (!friend) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This email doesn't exist in our records",
        });
      }
      return friend;
    }),
  getAllPicturesAndAlbums: protectedProcedure.query(async ({ ctx }) => {
    logger.info(
      `Getting all pictures and albums for user ${ctx.session.userId}`,
    );
    const pictures = await ctx.db.sharedPicture.findMany({
      where: {
        user_device: {
          id: ctx.session.user.id,
        },
      },
      select: {
        id: true,
        key: true,
      },
    });
    const albums = await ctx.db.sharedAlbum.findMany({
      where: {
        user_device: {
          id: ctx.session.user.id,
        },
      },
      select: {
        id: true,
        albumName: true,
      },
    });
    return {
      pictures: pictures,
      albums: albums,
    };
  }),
  updateKeys: protectedProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        pubKey: z.string(),
        pictures: z.array(
          z.object({
            id: z.string(),
            key: z.string(),
          }),
        ),
        albums: z.array(
          z.object({
            id: z.string(),
            albumName: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      logger.info(`Updating keys for user ${ctx.session.userId}`);
      const picturesId = input.pictures.map((picture) => picture.id);
      const albumsId = input.albums.map((album) => album.id);
      const pictures = await ctx.db.sharedPicture.findMany({
        where: {
          AND: {
            id: {
              in: picturesId,
            },
            user_device: {
              id: ctx.session.user.id,
            },
          },
        },
      });
      const albums = await ctx.db.sharedAlbum.findMany({
        where: {
          AND: {
            id: {
              in: albumsId,
            },
            user_device: {
              id: ctx.session.user.id,
            },
          },
        },
      });
      if (pictures.length !== input.pictures.length) {
        logger.error(`Updating keys for user ${ctx.session.userId} pictures mismatch`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Some pictures were not found",
        });
      }
      if (albums.length !== input.albums.length) {
        logger.error(`Updating keys for user ${ctx.session.userId} album mismatch`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Some albums were not found",
        });
      }
      await ctx.db.$transaction(async (t) => {
        await Promise.all(
          input.pictures.map(async (picture) => {
            await t.sharedPicture.update({
              where: {
                id: picture.id,
              },
              data: {
                key: picture.key,
              },
            });
          }),
        );
        await Promise.all(
          input.albums.map(async (album) => {
            await t.sharedAlbum.update({
              where: {
                id: album.id,
              },
              data: {
                albumName: album.albumName,
              },
            });
          }),
        );
        await t.userDevice.update({
          where: {
            id: ctx.session.user.id,
          },
          data: {
            publicKey: input.pubKey,
          },
        });
        if (input.email) {
          await t.user.update({
            where: {
              id: ctx.session.userId,
            },
            data: {
              email: input.email,
            },
          });
        }
        logger.info(`Updating keys for user ${ctx.session.userId} SUCCESS`);
      });
    }),
  updateEmail: protectedProcedure
    .input(z.string().email())
    .mutation(async ({ ctx, input }) => {
      logger.info(`Updating email for user ${ctx.session.userId}`);
      await ctx.db.user.update({
        where: {
          id: ctx.session.userId,
        },
        data: {
          email: input,
        },
      });
    }),
});
