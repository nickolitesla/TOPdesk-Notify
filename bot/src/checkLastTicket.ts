import sendPost from "./internal/sendPost";

// this variable is for the last ticket we sent in a card
export var lastTicket = '';

// COMxxx list for NA
const acceptableCOM = "COM224 COM225 COM258 COM265 COM271 COM274 COM290 COM295 COM313 COM317 COM333 COM335 COM339"

// function that will set last ticket 
export function checkLastTicket(data) {
   
    // COMxxx list for NA
    const acceptableCOM = "COM224 COM225 COM258 COM265 COM271 COM274 COM290 COM295 COM313 COM317 COM333 COM335 COM339"
  
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