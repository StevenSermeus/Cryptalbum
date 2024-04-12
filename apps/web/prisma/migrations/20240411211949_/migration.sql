-- AlterTable
ALTER TABLE "UserDevice" ADD COLUMN     "isTrusted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserDeviceChallenge" ADD COLUMN     "isValidated" BOOLEAN NOT NULL DEFAULT false;
