/* 
  index.ts
  This is the entry point for the app.

  @created: 7/26/2022
  @author: Nick Fowler
 */

import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import * as restify from "restify";
import notificationTemplate from "./adaptiveCards/notification-default.json";
import { bot } from "./internal/initialize";
import { CardData } from "./cardModels";
import getIncidents from "./getIncidents";


// Create HTTP server.
const server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});

// Register an API endpoint with `restify`.
//
// This endpoint is provided by your application to listen to events. You can configure
// your IT processes, other applications, background tasks, etc - to POST events to this
// endpoint.
//
// In response to events, this function sends Adaptive Cards to Teams. You can update the logic in this function
// to suit your needs. You can enrich the event with additional data and send an Adaptive Card as required.
//
// You can add authentication / authorization for this API. Refer to
// https://aka.ms/teamsfx-notification for more details.

server.post(
  "/api/notification",
  restify.plugins.queryParser(),
  restify.plugins.bodyParser(), // Add more parsers if needed
  async (req, res) => {
  
    // create variables to store the info from request
    // ticket brief descp, number / caller, request, link to ticket respectively
    var title = req.body.briefDescription;
    var appName = req.body.number + " | " + req.body.caller.dynamicName;
    var description = req.body.request;

    // Images are processed as ※ and need to be removed
    description = description.replace(/※/g, '');

    let i = 0;
    let count = 0;

    // make a new line after users name 
    // need \n\n to do newline in teams card
    while (i < description.length) {
      
      // if we find : increment count
      if (description[i] == ":") {
        count++;
      }
      
      // once we reached the 3 : we enter newline after it
      // i+1 makes it so we are after the last :
      if (count == 3) {
        description = description.replace(description.substring(0, i+1) , '$& \n\n');
        break;
      }

      i++;
    }

    // max 350 characters in 
    description = description.substring(0, 350)
   

    var notificationUrl = "https://fagron.topdesk.net/tas/secure/incident?action=lookup&lookup=naam&lookupValue=" + req.body.number;

    // By default this function will iterate all the installation points and send an Adaptive Card
    // to every installation.
    for (const target of await bot.notification.installations()) {

      // sends notification to that Person
      if(target.type === "Person"){
        await target.sendAdaptiveCard(
          AdaptiveCards.declare<CardData>(notificationTemplate).render({
            title: title,
            appName: appName,
            description: description,
            //description: `This is a sample http-triggered notification to ${target.type}`,
            notificationUrl: notificationUrl,
          })
        );
      }

      // Note - you can filter the installations if you don't want to send the event to every installation.

      /** For example, if the current target is a "Group" this means that the notification application is
       *  installed in a Group Chat.
      if (target.type === "Group") {
        // You can send the Adaptive Card to the Group Chat
        await target.sendAdaptiveCard(...);

        // Or you can list all members in the Group Chat and send the Adaptive Card to each Team member
        const members = await target.members();
        for (const member of members) {
          // You can even filter the members and only send the Adaptive Card to members that fit a criteria
          await member.sendAdaptiveCard(...);
        }
      }
      **/

      /** If the current target is "Person" this means that the notification application is installed in a
       *  personal chat.
      if (target.type === "Person") {
        // Directly notify the individual person
        await target.sendAdaptiveCard(...);
      }
      **/
    }

    res.json({});
  }
);


  // The Teams Toolkit bot registration configures the bot with `/api/messages` as the
  // Bot Framework endpoint. If you customize this route, update the Bot registration
  // in `/templates/provision/bot.bicep`.
  server.post("/api/messages", async (req, res) => {
    await bot.requestHandler(req, res);
  });

// Run the getIncidents function every 10s
setInterval(getIncidents, 10 * 1000);





