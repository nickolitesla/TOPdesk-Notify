# TOPdesk Notify
## About
TOPdesk Notify is a nifty application I created to utilize a Teams bot and TOPdesk's API to send myself notifications each time a ticket is submitted to FirstLine.

![image](https://user-images.githubusercontent.com/35699579/183516789-db612d21-d13b-421a-98b0-07e42c91c42c.png)

## Getting Started
Pre-requisites: 
- A TOPdesk API password (Use this link to setup - https://developers.topdesk.com/tutorial.html)
- Teams Toolkit Extension in vscode

After cloning the repository you will need a .env.teamsfx.local file in bot/src. You will need to at least provide a BOT_ID, BOT_PASSWORD, and TOPDESK_API_TOKEN. Not sure how to generate BOT_ID & BOT_PASSWORD; I haven't tried doing this without the Teams Toolkit yet so I will update once I know how this is done.

You will need to run "npm i" in both the "TOPDesk Notify" & "bot" folder. 

After this step there are variables that will need changed; though I'm currently working on changing the way these variables are set - getting user input instead of set in app. 

There are a plethera of updates that will antiquate any additional instructions I could give you... Thanks!
