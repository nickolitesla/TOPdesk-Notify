import axios from "axios";
import { lastTicket, checkLastTicket } from "./checkLastTicket";

const token = process.env.TOPDESK_API_TOKEN;

const acceptableCOM = "COM224 COM225 COM258 COM265 COM271 COM274 COM290 COM295 COM313 COM317 COM333 COM335"

// API call every 10s to see if there is a new ticket in First line
// Filter by JSON fields "clientReferenceNumber", "status", "number"
// the API only gives 10 incidents at a time
// tickets from API order neweset (1) to oldest (10)
export async function getIncidents() {

// count how many times we've called the TOPdesk API
console.count();

    try {
    await axios.get('https://fagron.topdesk.net/tas/api/incidents', {
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
    catch (err) {
    if (axios.isAxiosError(err)) {
        console.log('error message: ', err.message);
        throw err.message;
    }
    else {
        console.log('unexpected error: ', err);
        throw 'An unexpected error occurred';
    }
    }
}
  

export default getIncidents;