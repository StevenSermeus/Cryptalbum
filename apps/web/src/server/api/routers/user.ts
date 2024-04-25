import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import logger from "@/utils/logger";
import { rateLimitedMiddleware } from "@/server/api/trpc";

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
});
