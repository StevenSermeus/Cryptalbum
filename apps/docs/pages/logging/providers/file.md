# File provider

The File provider is a good way to store logs.

## Usage

```ts
import { Logger } from "logcm";
import { FileProvider } from "logcm/providers";

const logger = Logger.getLogger(
  "[TYPE] HH:MI:SS:MS DD/MM/YYYY TZ MSG",
  [new FileProvider()],
  process.env.SECRET,
);
```

This provider allows you to specify the folder where the logs will be stored.

```ts
import { Logger } from "logcm";
import { FileProvider } from "logcm/providers";

const logger = Logger.getLogger(
  "[TYPE] HH:MI:SS:MS DD/MM/YYYY TZ MSG",
  [new FileProvider({ folderPath: "./logs" })],
  process.env.SECRET,
);
```

This provider allows you to specify the file name where the logs will be stored and if they should be stored by day.

```ts
import { Logger } from "logcm";
import { FileProvider } from "logcm/providers";

const logger = Logger.getLogger(
  "[TYPE] HH:MI:SS:MS DD/MM/YYYY TZ MSG",
  [
    new FileProvider({
      folderPath: "./logs",
      fileByDay: false,
      fileName: "log.log",
    }),
  ],
  process.env.SECRET,
);
```
