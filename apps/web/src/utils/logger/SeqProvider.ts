import { LogType, MoreInfo, Provider } from "logcm";
import Logger, { createLogger } from "bunyan";
import seq from "bunyan-seq";

class SeqProvider extends Provider {
  private logger: Logger;
  constructor(
    private readonly url: string,
    logLevel: LogType[],
  ) {
    super(logLevel);
    this.logger = createLogger({
      name: "web",
      streams: [
        seq.createStream({
          serverUrl: url,
        }),
      ],
    });
  }
  public log(message: string, moreInfo: MoreInfo): void {
    const { type } = moreInfo;
    switch (type) {
      case LogType.INFO:
        this.logger.info(message);
        break;
      case LogType.WARNING:
        this.logger.warn(message);
        break;
      case LogType.DEBUG:
        this.logger.debug(message);
        break;
      case LogType.CRITICAL:
        this.logger.error(message);
        break;
      case LogType.ERROR:
        this.logger.error(message);
        break;
      default:
        this.logger.info(message);
    }
  }
}

export default SeqProvider;
