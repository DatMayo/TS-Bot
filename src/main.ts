import { TeamSpeak } from 'ts3-nodejs-library';
import { Bot } from './bot';
import { TeamBot } from './bot/plugins';
//import { ChannelBot, GreeterBot, SupportBot, TeamBot } from './logic';
import * as dotenv from 'dotenv';
dotenv.config();

const teamspeak = new TeamSpeak({
    host: process.env.TS_HOST || '127.0.0.1',
    serverport: parseInt(process.env.TS_SERVERPORT || '9987'),
    queryport: parseInt(process.env.TS_QUERYPORT || '10011'),
    username: process.env.TS_USERNAME || 'serveradmin',
    password: process.env.TS_PASSWORD || 'secret',
});

//const serverName = 'Mayos & Polles Testserver';

const bot = new Bot(teamspeak);
new TeamBot(bot);

//new ChannelBot(teamspeak, serverName);
//new GreeterBot(teamspeak, serverName);
//new TeamBot(teamspeak, serverName);
//new SupportBot(teamspeak, serverName);
