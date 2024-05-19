import { Logger, LogType } from "logcm";
import { ConsoleProvider, FileProvider } from "logcm/providers";
import SeqProvider from "./SeqProvider";
import { env } from "@/env";

const seqUrl = process.env.SEQ_URL || "http://localhost:8081";
const logger = Logger.getLogger(
  [
    new SeqProvider(seqUrl, [
      LogType.INFO,
      LogType.ERROR,
      LogType.CRITICAL,
      LogType.WARNING,
      LogType.DEBUG,
    ]),
    new ConsoleProvider(),
    new FileProvider({
      filePath: "/tmp",
      fileByDay: true,
      fileName: "log",
      logLevel: [
        LogType.INFO,
        LogType.ERROR,
        LogType.CRITICAL,
        LogType.WARNING,
        LogType.DEBUG,
      ],
    }),
  ],
  env.LOGGER_SECRET || "secret",
);

export default logger;
