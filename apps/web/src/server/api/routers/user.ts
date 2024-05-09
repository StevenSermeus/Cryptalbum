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
});
