import { env } from "@/env";
import { Logger, LogType } from "logcm";
import { ConsoleProvider, FileProvider } from "logcm/providers";

export const logger = Logger.getLogger([
  new ConsoleProvider({
    logLevel: [
      LogType.INFO,
      LogType.ERROR,
      LogType.WARNING,
      env.NODE_ENV === "development" ? LogType.DEBUG : LogType.INFO,
    ],
  }),
  new FileProvider({
    fileByDate: true,
    fileName: "photo.log",
    basePath: "./logs",
  }),
]);
