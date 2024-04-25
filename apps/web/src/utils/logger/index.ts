import { Logger } from "logcm";
import { ConsoleProvider } from "logcm/providers";

const logger = Logger.getLogger([new ConsoleProvider()], "");

export default logger;
