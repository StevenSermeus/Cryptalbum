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
            await t.shared.create({
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
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const pictures_user = await ctx.db.picture.findMany({
        where: {
          userId: ctx.session.userId,
        },
        include: {
          shareds: {
            where: {
              user_device: {
                id: ctx.session.user.id,
              },
            },
          },
        },
      });
      const files = [];
      for (const picturedb of pictures_user) {
        if (
          picturedb.shareds.length !== 1 &&
          picturedb.shareds[0]?.key === undefined
        ) {
          return [];
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
            id: picturedb.id,
            key: picturedb.shareds[0]?.key as string,
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
      const sharedKeys = await ctx.db.shared.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        select: {
          key: true,
          id: true,
        },
      });
      console.log(sharedKeys, "sharedKeys");
      return sharedKeys;
    }),
});
