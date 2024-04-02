# Discord provider

The Discord provider is a provider that sends messages to a Discord channel using a webhook. It is useful for being notified of events in your application. By default, the provider sends messages of type `CRITICAL`, `ERROR`, and `WARNING`. Messages may not arrive in the order they were sent. It is recommended to use other providers in combination with this provider.

## Usage

```ts
import { Logger } from "logcm";
import { DiscordProvider } from "logcm/providers";

const logger = Logger.getLogger(
  "[TYPE] HH:MI:SS:MS DD/MM/YYYY TZ MSG",
  [
    new DiscordProvider({
      webhookUrl: "discord webhook url",
    }),
  ],
  process.env.SECRET,
);
```

You can provide arguments to change the picture and username of the webhook.

```ts
import { Logger } from "logcm";
import { DiscordProvider } from "logcm/providers";

const logger = Logger.getLogger(
  "[TYPE] HH:MI:SS:MS DD/MM/YYYY TZ MSG",
  [
    new DiscordProvider({
      webhookUrl: "discord webhook",
      logLevels: [LogType.CRITICAL, LogType.ERROR, LogType.WARNING],
      username: "Logger",
      avatarUrl: "",
    }),
  ],
  process.env.SECRET,
);
```
