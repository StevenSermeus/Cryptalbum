import { PrismaAdapter } from "@auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { type Adapter } from "next-auth/adapters";
import logger from "@/utils/logger";
import { db } from "@/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  //eslint-disable-next-line no-unused-vars
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      userId: string;
      // ...other properties
      // role: UserRole;
    };
  }

  // interface User {
  //   id: string;
  //   ...other properties
  //   role: UserRole;
  // }
}

declare module "next-auth/jwt" {
  export interface JWT {
    id: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    async session(data) {
      const user = data.session.user;
      const session = data.session;
      if (user) {
        session.user = user;
        session.user.id = data.token.id;
      }
      const userDevice = await db.userDevice.findFirst({
        where: { id: session.user.id },
      });

      if (userDevice) {
        session.user.userId = userDevice.userId;
      }

      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
  },
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { type: "email" },
        challenge: { type: "text" },
        challengeId: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) {
          logger.error("No credentials provided");
          return null;
        }
        if (!credentials.challengeId || !credentials.challenge) {
          logger.error("No challengeId or challenge provided");
          return null;
        }
        const challenge = await db.userDeviceChallenge.findFirst({
          where: {
            id: credentials.challengeId,
            challenge: credentials.challenge,
          },
          include: {
            userDevice: {
              include: {
                user: true,
              },
            },
          },
        });
        logger.info(
          `Logging attemps from deviceId ${challenge?.userDevice.id} with challengeId ${credentials.challengeId} and challenge ${credentials.challenge}`,
        );
        if (
          !challenge ||
          challenge.isValidated ||
          !(challenge.expires > new Date())
        ) {
          return null;
        }
        if (challenge.userDevice.user.email !== credentials.email) {
          return null;
        }
        await db.userDeviceChallenge.update({
          where: {
            id: credentials.challengeId,
          },
          data: {
            isValidated: true,
          },
        });
        if (!challenge) {
          logger.error(`No challenge found for ${credentials.email}`);
          return null;
        }
        if (!challenge.userDevice.isTrusted) {
          logger.error(
            `Device ${challenge.userDevice.id} is not trusted for user ${challenge.userDevice.user.email}`,
          );
          return null;
        }
        await db.userDevice.update({
          where: {
            id: challenge.userDevice.id,
          },
          data: {
            lastLogin: new Date(),
          },
        });
        logger.info(
          `User ${challenge.userDevice.user.email} logged in with device ${challenge.userDevice.id}`,
        );
        return {
          id: challenge.userDevice.id,
          email: credentials.email,
          name: challenge.userDevice.user.name,
        };
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
