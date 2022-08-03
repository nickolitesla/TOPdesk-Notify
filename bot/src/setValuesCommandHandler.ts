import { Activity, TurnContext } from "botbuilder";
import { CommandMessage, TeamsFxBotCommandHandler, TriggerPatterns } from "@microsoft/teamsfx";
import { MessageBuilder } from "@microsoft/teamsfx";

export class setValuesCommandHandler implements TeamsFxBotCommandHandler {
    triggerPatterns: TriggerPatterns = "set status";

    async handleCommandReceived(
        context: TurnContext,
        message: CommandMessage
    ): Promise<string | Partial<Activity>> {
        // verify the command arguments which are received from the client if needed.
        console.log(`Bot received message: ${message.text}`);
        return message.text;
        // do something to process your command and return message activity as the response.
        // You can leverage `MessageBuilder` utilities from the `@microsoft/teamsfx` SDK 
        // to facilitate building message with cards supported in Teams.
    }    
}