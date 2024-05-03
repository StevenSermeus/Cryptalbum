import { Logger, LogType } from "logcm";
import { ConsoleProvider, FileProvider } from "logcm/providers";
import SeqProvider from "./SeqProvider";
const logger = Logger.getLogger([
  new SeqProvider("http://localhost:5341", [
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
]);

export default logger;
