# Console provider

The Console provider is a simple provider that outputs the message to the console. It is useful for debugging and testing purposes.

## Usage

```ts
import { Logger } from "logcm";
import { ConsoleProvider } from "logcm/providers";

const logger = Logger.getLogger(
  "[TYPE] HH:MI:SS:MS DD/MM/YYYY TZ MSG",
  [new ConsoleProvider()],
  process.env.SECRET,
);
```

You can provide the log level to the `ConsoleProvider` constructor to only log messages present in the list.

```ts
import { Logger } from "logcm";
import { ConsoleProvider } from "logcm/providers";
import { LogLevel } from "logcm/types";

const logger = Logger.getLogger(
  "[TYPE] HH:MI:SS:MS DD/MM/YYYY TZ MSG",
  [new ConsoleProvider([LogLevel.INFO, LogLevel.ERROR])], // Only log INFO and ERROR messages
  process.env.SECRET,
);
```
