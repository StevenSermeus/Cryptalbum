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
  share: protectedProcedure.mutation(async () => {
    return "Salut";
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
          // TODO: TEMPORARY FIX find a better way to do it
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
            userId : picturedb.userId,
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
