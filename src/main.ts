import { TeamSpeak } from 'ts3-nodejs-library';
import { Bot } from './bot';
import { TeamBot, GreeterBot } from './bot/plugins';
import * as dotenv from 'dotenv';
dotenv.config();

const teamspeak = new TeamSpeak({
    host: process.env.TS_HOST || '127.0.0.1',
    serverport: parseInt(process.env.TS_SERVERPORT || '9987'),
    queryport: parseInt(process.env.TS_QUERYPORT || '10011'),
    username: process.env.TS_USERNAME || 'serveradmin',
    password: process.env.TS_PASSWORD || 'secret',
});

const bot = new Bot(teamspeak);
new TeamBot(bot);
new GreeterBot(bot);

//new ChannelBot(teamspeak, serverName);
//new SupportBot(teamspeak, serverName);
