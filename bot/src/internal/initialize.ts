import { ConversationBot } from "@microsoft/teamsfx";
import { setValuesCommandHandler } from "../setValuesCommandHandler";

// Create bot.
export const bot = new ConversationBot({
  // The bot id and password to create BotFrameworkAdapter.
  // See https://aka.ms/about-bot-adapter to learn more about adapters.
  adapterConfig: {
    appId: process.env.BOT_ID,
    appPassword: process.env.BOT_PASSWORD,
  },
  // Enable notification
  notification: {
    enabled: true,
  },
  command: {
    enabled: true,
    commands: [new setValuesCommandHandler()],
  }
});
