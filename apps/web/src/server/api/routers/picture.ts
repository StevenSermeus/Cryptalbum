import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  rateLimitedMiddleware,
} from "@/server/api/trpc";
import logger from "@/utils/logger";

export const pictureRouter = createTRPCRouter({
  upload: protectedProcedure
    .input(
      z.object({
        file: z.string(),
        keys_user_device: z.array(
          z.object({
            key: z.string(),
            device_id: z.string(),
          }),
        ),
      }),
    )
    .use(rateLimitedMiddleware)
    .mutation(async ({ ctx, input }) => {
      try {
        logger.info(
          `User ${ctx.session.userId} initialized upload of a picture`,
        );
        await ctx.db.$transaction(async (t) => {
          const picture = await t.picture.create({
            data: {
              owner: {
                connect: {
                  id: ctx.session.userId,
                },
              },
            },
          });
          for (const key of input.keys_user_device) {
            await t.sharedPicture.create({
              data: {
                picture: {
                  connect: {
                    id: picture.id,
                  },
                },
                user_device: {
                  connect: {
                    id: key.device_id,
                  },
                },
                key: key.key,
              },
            });
          }
          await ctx.minio.putObject("pictures", picture.id, input.file);
          logger.info(
            `Uploaded file ${picture.id} for user ${ctx.session.userId}`,
          );
        });
      } catch (e) {
        logger.error(
          `Failed to upload file for user ${ctx.session.userId} with error: ${e}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload file. Please try again.",
        });
      }
    }),

  shareWithDevices: protectedProcedure
    .input(
      z.object({
        pictureId: z.string(),
        sharedPictures: z.array(
          z.object({
            deviceId: z.string(),
            key: z.string(),
          }),
        ),
      }),
    )
    .use(rateLimitedMiddleware)
    .mutation(async ({ ctx, input }) => {
      try {
        logger.info(
          `Starting the pictures share process by ${ctx.session.userId} for a list of devices`,
        );
        const picture = await ctx.db.picture.findUnique({
          where: { id: input.pictureId },
          select: { userId: true },
        });

        if (!picture || picture.userId !== ctx.session.userId) {
          !picture
            ? logger.warn(`Picture ${input.pictureId} not found to share`)
            : logger.warn(
                `User ${ctx.session.userId} is not the owner of the picture ${input.pictureId}`,
              );
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You are not the owner of this album or the album does not exist.",
          });
        }
        await ctx.db.$transaction(async (t) => {
          for (const sharedPicture of input.sharedPictures) {
            await t.sharedPicture.upsert({
              where: {
                deviceId_pictureId: {
                  deviceId: sharedPicture.deviceId,
                  pictureId: input.pictureId,
                },
              },
              update: {
                key: sharedPicture.key,
              },
              create: {
                deviceId: sharedPicture.deviceId,
                pictureId: input.pictureId,
                key: sharedPicture.key,
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
  getAll: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    try {
      let pictures_user: ({
        albums: { id: string }[];
        sharedPictures: {
          id: string;
          deviceId: string;
          pictureId: string;
          key: string;
          createdAt: Date;
          updatedAt: Date;
        }[];
      } & { id: string; userId: string; createdAt: Date; updatedAt: Date })[] =
        [];
      if (input === "gallery") {
        pictures_user = await ctx.db.picture.findMany({
          where: {
            userId: ctx.session.userId,
          },
          include: {
            sharedPictures: {
              where: {
                user_device: {
                  id: ctx.session.user.id,
                },
              },
            },
            albums: {
              select: {
                id: true,
              },
            },
          },
        });
      } else if (input === "sharedPictures") {
        pictures_user = await ctx.db.picture.findMany({
          where: {
            userId: { not: ctx.session.userId },
          },
          include: {
            sharedPictures: {
              where: {
                user_device: {
                  id: ctx.session.user.id,
                },
              },
            },
            albums: {
              select: {
                id: true,
              },
            },
          },
        });
      } else {
        pictures_user = await ctx.db.picture.findMany({
          where: {
            albums: {
              some: {
                id: input,
              },
            },
          },
          include: {
            sharedPictures: {
              where: {
                user_device: {
                  id: ctx.session.user.id,
                },
              },
            },
            albums: {
              select: {
                id: true,
              },
            },
          },
        });
      }
      const files = [];
      for (const picturedb of pictures_user) {
        if (
          picturedb.sharedPictures.length !== 1 &&
          picturedb.sharedPictures[0]?.key === undefined
        ) {
          continue;
        } else {
          const minio_file = await ctx.minio.getObject(
            "pictures",
            picturedb.id,
          );
          const promise: Promise<string> = new Promise((resolve, reject) => {
            let file_wait = "";
            minio_file.on("data", (chunk) => {
              file_wait += chunk.toString();
            });
            minio_file.on("end", () => {
              resolve(file_wait);
            });
            minio_file.on("error", (err) => {
              reject(err);
            });
          });
          const file_encrypted = await promise;
          files.push({
            userId: picturedb.userId,
            id: picturedb.id,
            key: picturedb.sharedPictures[0]?.key as string,
            albums: picturedb.albums.map((album: { id: string }) => album.id),
            file: file_encrypted,
          });
        }
      }
      return files;
    } catch (e) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload file. Please try again.",
      });
    }
  }),
  getSharedKeys: protectedProcedure
    .use(rateLimitedMiddleware)
    .query(async ({ ctx }) => {
      const sharedKeys = await ctx.db.sharedPicture.findMany({
        where: {
          deviceId: ctx.session.user.id,
        },
        select: {
          key: true,
          id: true,
        },
      });
      return sharedKeys;
    }),
  addPictureToAlbum: protectedProcedure
    .input(
      z.object({
        pictureId: z.string(),
        albumId: z.string(),
      }),
    )
    .use(rateLimitedMiddleware)
    .mutation(async ({ ctx, input }) => {
      try {
        logger.info(
          `Adding the picture ${input.pictureId} to album ${input.albumId} by ${ctx.session.userId}`,
        );
        const picture = await ctx.db.picture.findUnique({
          where: {
            id: input.pictureId,
            userId: ctx.session.userId,
          },
          select: { userId: true },
        });

        const album = await ctx.db.album.findUnique({
          where: {
            id: input.albumId,
            userId: ctx.session.userId,
          },
          select: { userId: true },
        });

        if (!picture || picture.userId !== ctx.session.userId) {
          !picture
            ? logger.warn(
                `Picture ${input.pictureId} not found to add to album`,
              )
            : logger.warn(
                `User ${ctx.session.userId} is not the owner of the picture ${input.pictureId}`,
              );
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You are not the owner of this picture or the picture does not exist.",
          });
        }

        if (!album || album.userId !== ctx.session.userId) {
          !album
            ? logger.warn(
                `Album ${input.albumId} not found to add the picture ${input.pictureId}`,
              )
            : logger.warn(
                `User ${ctx.session.userId} is not the owner of the album ${input.albumId}`,
              );
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You are not the owner of this album or the album does not exist.",
          });
        }

        await ctx.db.picture.update({
          where: {
            id: input.pictureId,
          },
          data: {
            albums: {
              connect: {
                id: input.albumId,
              },
            },
          },
        });
      } catch (e) {
        logger.error(
          `Failed to add picture to album for user ${ctx.session.userId} with error: ${e}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add picture to album. Please try again.",
        });
      }
    }),
});
