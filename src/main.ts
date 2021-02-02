import { TeamSpeak } from 'ts3-nodejs-library';
import { ChannelBot, GreeterBot, SupportBot, TeamBot } from './logic';

const teamspeak = new TeamSpeak({
    host: process.env.TS_HOST || '127.0.0.1',
    queryport: parseInt(process.env.TS_QUERYPORT || '10011'),
    username: process.env.TS_USERNAME || 'serveradmin',
    password: process.env.TS_PASSWORD || 'secret',
});

const serverName = 'Mayos & Polles Testserver';

new ChannelBot(teamspeak, serverName);
new GreeterBot(teamspeak, serverName);
new TeamBot(teamspeak, serverName);
new SupportBot(teamspeak, serverName);
