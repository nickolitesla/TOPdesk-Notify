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
import axios from "axios";


const token = process.env.TOPDESK_API_TOKEN;


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

      /** If the current target is "Channel" this means that the notification application is installed
       *  in a Team.
      if (target.type === "Channel") {
        // If you send an Adaptive Card to the Team (the target), it sends it to the `General` channel of the Team
        await target.sendAdaptiveCard(...);

        // Alternatively, you can list all channels in the Team and send the Adaptive Card to each channel
        const channels = await target.channels();
        for (const channel of channels) {
          await channel.sendAdaptiveCard(...);
        }

        // Or, you can list all members in the Team and send the Adaptive Card to each Team member
        const members = await target.members();
        for (const member of members) {
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

// this variable is for the last ticket we sent in a card
var lastTicket = '';
var apiCallCount = 0;

const acceptableCOM = "COM224 COM225 COM258 COM265 COM271 COM274 COM290 COM295 COM313 COM317 COM333 COM335"

// API call every 10s to see if there is a new ticket in First line
// Filter by JSON fields "clientReferenceNumber", "status", "number"
// the API only gives 10 incidents at a time
// tickets from API order neweset (1) to oldest (10)
async function getIncidents() {
  
  // count how many times we've called the TOPdesk API
  apiCallCount = apiCallCount + 1;
  console.log(apiCallCount);

    try {
      axios.get('https://fagron.topdesk.net/tas/api/incidents', {
        headers: {
          Accept: 'application/json',
          Authorization: `${token}`,
        },
        params: {
          all: true,
          fields: 'number, caller, responded, status, briefDescription, dynamicName, caller.branch.clientReferenceNumber, caller.dynamicName, request' 
        }
      }).then(res => {

        // get data variable
        var data = res.data;

        console.log("last ticket in getIncidents: " + lastTicket);
        checkLastTicket(data);
        console.log("made it out of check with last ticket: " + lastTicket + "\n")
      })
    }
    catch (error) {
      if (axios.isAxiosError(error)) {
        console.log('error message: ', error.message);
        throw error.message;
      }
      else {
        console.log('unexpected error: ', error);
        throw 'An unexpected error occurred';
      }
    }
}

// function that will set last ticket 
function checkLastTicket(data) {
   
  // COMxxx list for NA
  const acceptableCOM = "COM224 COM225 COM258 COM265 COM271 COM274 COM290 COM295 COM313 COM317 COM333 COM335"

  // if lastTicket is empty
  if (lastTicket == '') {
    console.log('lastTicket is empty')
    
    // loop over json to find newest ticket
    // once lastTicket gets assigned value exit
    let i = 0;
    while((i < data.length) && lastTicket == ""){
      
      // if ticket is valid send post
      if (checkValid(data[i])) {
        lastTicket = data[i].number;
        sendPost(data[i])
      }
  
      i++;
    }
    
  }

  // if lastTicket has a value we will run this code
  else {
    console.log('lastTicket is not empty')

    let i = 0;
    let tempTicket = "";

    // loop json until we reach end of json array
    // or we find the last ticket 
    while((i < data.length) && lastTicket != tempTicket) {
      
      // set tempTicket before we think of posting
      tempTicket = data[i].number;

      // check if ticket is valid
      if (checkValid(data[i])) {
        console.log("Temporary Ticket: " + tempTicket);
        console.log("Last ticket: " + lastTicket);
        
        // make sure we are not reposting the same ticket
        if (tempTicket != lastTicket) {
          lastTicket = data[i].number;
          sendPost(data[i]);
        }
        
        // Just checking to see that the ticket numbers actually match
        else {
          console.log(tempTicket + " Temp Ticket = " + lastTicket + " Last Ticket");
        }
      }  
      i++;
    }
  }

  console.log("Last ticket at end of checkLastTicket():" + lastTicket)

  return lastTicket;
}

// check if ticket is in COMXXX, not responded, and firstline
function checkValid(data) {
  
  let valid; 

  // if caller is empty we need to return the ticket
  // might be false positive 
  // keeps this from breaking
  if (data.caller.branch == null) {
    data.caller.branch == '';
    valid = true;
    return valid;
  }
  
  console.log("in checkValid() testing: " + data.caller.branch.clientReferenceNumber);
  
  // checks to see if ticket is in acceptableCOM and not Closed and firstLine
  if ((acceptableCOM.includes(data.caller.branch.clientReferenceNumber) || data.caller.branch.clientReferenceNumber == null) && (data.responded == false) && (data.status == "firstLine")) {
    console.log(data.caller.branch.clientReferenceNumber + ": Acceptable COM & Not Responded & In FL");
    valid = true;
    return valid;
  }

  // if the last ticket received is closed then set lastTicket as that
  if (acceptableCOM.includes(data.caller.branch.clientReferenceNumber) && (data.responded == true) && (data.status == "firstLine")) {
    console.log(data.caller.branch.clientReferenceNumber) + ": Acceptable COM & Responded";
    valid = true;
    return valid
  }

  // checks tickets to see if lastest ticket is archived and sets to latest ticket
  // this avoids bug that would print ticket 1 once when it comes in, ticket 2 comes in,
  // ticket 2 gets archived, then ticket 1 would be printed again since ticket 2 updated lastTicket
  if (acceptableCOM.includes(data.caller.branch.clientReferenceNumber) && (data.responded == true) && (data.status == "firstLineArchived")) {
    console.log(data.caller.branch.clientReferenceNumber + ": Acceptable COM & Not Responded & In FL");
    lastTicket = data.number;
    console.log("Latest ticket is archived but is still set to last ticket: " + lastTicket);
    valid = false;
    return valid;
  }
}

// send post request to my HTTP server
function sendPost(data) {

  console.log("in sendPost()");
  
  try {

    // send post to teams server
    console.log("in try")
    axios.post('http://localhost:3978/api/notification', data).then((res) => {
      console.log('Status: ' + res.status);
    }).catch((e) => {
      console.error(e);
    })
  }catch (e) {
    if (axios.isAxiosError(e)) {
      console.log('error message: ', e.message);
      return e.message;
    }
    else {
      console.log('unexpected error: ', e);
      return 'An unexpected error occurred';
    }
  }
}

setInterval(getIncidents, 10 * 1000);





