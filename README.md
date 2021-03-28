# TS-Bot
TeamSpeak Server can get really messy, if they have a lot of channels. This simple bot will help you a bit, organizing your TeamSpeak Server.

## What do I need ?
1. A TeamSpeak 3 Server (obviusly)
1. A (v)Server, where you can run this bot
1. A query login
1. The TS3 Query data (IP, Port, etc)

## .env Explaination
|Key|Default|Explanation|
|---|---|---|
|TS_HOST|localhost|IP or hostname, where the bot will connect to|
|TS_SERVERPORT|9987|Port, where you and your users will connect|
|TS_QUERYPORT|10011|The telnet (not SSH!) port of your server, where the bot can send his commands|
|TS_USERNAME|serveradmin|The username to send querys (not the display name!)|
|TS_PASSWORD|secret|The password which is used to authenticate against the server|
|TS_NICKNAME|serveradmin|Display name which a user sees, when he i.E. connects to the server|
|TS_TEAM_GROUP|Team|The name of the team server group, so the bot knows if the user is a regular user or a team member|
|TS_SUPPORT_GROUP|Support|The group which will be assigned, once a supporter is "OnDuty"|
|TS_REGISTRATION_CHANNEL|On/OffDuty|The channel where a supporter can go on and off duty.|
|TS_GUEST_GROUP|Guest|The default name, of an unregistered user|
|TS_NEEDED_CHANNEL_POWER|50| // To Be Documented|
|TS_NEEDED_FILE_POWER|100| // To Be Documented|
## Setup the bot
As you've might expected, setting up this kind of bot, will take some effort. But it shouldnt take longer then 10-15 
min. at max., so lets get started.

### Configuring your Teamspeak
Before starting with this bot, you have to set up your TeamSpeak 3 Server. Read carefully, otherwise the bot will not 
work as expected! As a reference and example, this is how your server could look like, when you're starting:
![Example-Server layout](https://i.imgur.com/IedWMvX.png)
___
#### Creating credentials for you bot
So when connected to your server, click on "Tools" -> "ServerQuery Login". In this window enter a username for your bot 
(i.E. tsbot).

![ServerQuery Login Image](https://i.imgur.com/KNqhzWQ.png)

Then press ok and a username and password field will show up. You can use this in your .env file as `TS_USERNAME` and `TS_PASSWORD`.

![ServerQuery Password](https://i.imgur.com/ePd6cC8.png)
___
#### Setting up server groups
By default you'll need to setup 2 server groups:
1. The first one is a team group, this is a group every supporter, developer, mapper, ... needs to have. Otherwise the 
   bot will not recognize your team members. The group does not need any fancy rights, its just for the bot. This is 
   for the `TS_TEAM_GROUP` setting, in your .env file
1. The second group is a standby group, which will be assiged when a supporter/developer/... will give its spare time, 
   to support users. Like on 1st, this group does not require any special rights. This is for the `TS_SUPPORT_GROUP` 
   setting, in your .env file
___
#### Setting up the duty channel
After you've setup your groups, you'll need to create a channel on your server, where your staff can go on- and off 
duty (`TS_REGISTRATION_CHANNEL`). This channel can be anywhere on your server, but if you take my advice: place them on 
top of your support channel.

![Example duty channel](https://i.imgur.com/qEiqQmr.png)
___
#### Setting up managed channels
Managed channels are channels, who are managed by your bot. This can be Team-, Support-, Talk- or even Game channels. 
Due its complexity, there are no declaraions inside the .env file. You'll find these inside the 
[src/bot/plugins/channelbot.ts](./src/bot/plugins/channelbot.ts) file, starting at line 15.
```ts
private _managedChannels: IChannelDefinition[] = [
        { pattern: 'Team #', upperChannel: 'Team-Talk' },
        { pattern: 'Support #', upperChannel: 'Support' },
    ];
```
Every managed channel has 
2 parameters a `pattern` and an `upperChannel`. The `upperChannel` is the parent channel, where all child channels will 
be created in a numeric order with the given pattern. So if the pattern is i.E. "Support #", the channel names will be 
___Support #1___, ___Support #2___, ___Support #3___, ... 

After you've setup your your managed channels, you'll also need to setup the waiting area. This is the area, your
regular users will join, to get support. This can be one or more channels. The configuration can be done inside the
file [src/bot/plugins/supportbot.ts](./src/bot/plugins/supportbot.ts) at line 18.
```ts
private _managedSupportChannel: string[] = ['Waitingroom', 'Appointment'];
```
___
#### Building your bot
After setting all up, you have to build/transpile the code to plain js. You can do that via `npm run build`, when the 
build has finished, you'll end up with 2 files in the `build` directory. The first one is `bundle.plain.js` this file
is for local debugging, the second one is the minified and obfuscated version of the code. You don't need your 
`node_modules` folder, because everything is baked into this file.

## Test the TS-Bot
There is an easy way to test if everything works as expected. Just run:
```bash
npm run debug
```
If there were any errors, you'll see it.

## Deploying
To get the script running, just copy the `bundle.js` & `.env` file to your server and run it.