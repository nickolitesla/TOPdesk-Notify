// send post request to my HTTP server
import axios from "axios";

export default function sendPost(data) {

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