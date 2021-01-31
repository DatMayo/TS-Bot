import * as dotenv from 'dotenv';
import { ResponseError, TeamSpeak, TeamSpeakChannel, TeamSpeakServer, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { ClientConnect, ClientDisconnect, ClientMoved, TextMessage } from 'ts3-nodejs-library/lib/types/Events';
import { TSExitCode } from './enums';

dotenv.config();

const teamspeak = new TeamSpeak({
    host: process.env.TS_HOST || '127.0.0.1',
    queryport: parseInt(process.env.TS_QUERYPORT || '10011'),
    username: process.env.TS_USERNAME || 'serveradmin',
    password: process.env.TS_PASSWORD || 'secret',
    nickname: 'Hans Dampf',
});

class Bot {
    private _serverName: string;
    private _teamSpeakHandle: TeamSpeak;
    private _teamGroupName: string = process.env.TS_TEAM_GROUP || 'Team';
    private _supportGroupName: string = process.env.TS_SUPPORT_GROUP || 'Bereitschaft';
    private _guestGroupName: string = process.env.TS_GUEST_GROUP || 'Guest';
    private _teamGroupHandle: TeamSpeakServerGroup | undefined;
    private _supportGroupHandle: TeamSpeakServerGroup | undefined;
    private _guestGroupHandle: TeamSpeakServerGroup | undefined;
    // private _availableSupporter: TeamSpeakClient[] = [];
    private _tsDefaultChannel: TeamSpeakChannel | undefined;

    /**
     * Creates a new TS Bot instance
     * @param {TeamSpeak} teamSpeakHandle Handle to a connected server
     * @param {string} serverName Name of the server, which will be selected
     */
    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        this._teamSpeakHandle = teamSpeakHandle;
        this._serverName = serverName;
        teamspeak.on('ready', this.connectToServer.bind(this));
    }

    private async connectToServer(): Promise<void> {
        const teamSpeakServerHandle = (await this._teamSpeakHandle.serverList()).find(
            (item: TeamSpeakServer) => item.name === this._serverName,
        );
        if (!teamSpeakServerHandle) return process.exit(TSExitCode.VirtualServerNotFound);
        this._teamSpeakHandle.useBySid(teamSpeakServerHandle.id);

        this._tsDefaultChannel = (await this._teamSpeakHandle.channelList()).find((item) => item.flagDefault === true);
        if (!this._tsDefaultChannel) return process.exit(TSExitCode.DefaultChannelNotFound);

        this._teamGroupHandle = await this._teamSpeakHandle.getServerGroupByName(this._teamGroupName);
        if (!this._teamGroupHandle) return process.exit(TSExitCode.TeamGroupNotFound);

        this._supportGroupHandle = await this._teamSpeakHandle.getServerGroupByName(this._supportGroupName);
        if (!this._supportGroupHandle) return process.exit(TSExitCode.SupportGroupNotFound);

        this._guestGroupHandle = await this._teamSpeakHandle.getServerGroupByName(this._guestGroupName);
        if (!this._guestGroupHandle) return process.exit(TSExitCode.GuestGroupNotFound);

        this._teamSpeakHandle.on('clientconnect', this.clientConnect.bind(this));
        this._teamSpeakHandle.on('clientdisconnect', this.clientDisconnect.bind(this));
        this._teamSpeakHandle.on('clientmoved', this.clientMoved.bind(this));
        this._teamSpeakHandle.on('flooding', this.flooding.bind(this));
        this._teamSpeakHandle.on('textmessage', this.textMessage.bind(this));
        // this._teamSpeakHandle.on('debug', () => (debug: Debug) => console.log(debug))
    }

    private clientConnect(event: ClientConnect) {
        const client = event.client;
        if (client.servergroups.indexOf(this._guestGroupHandle!.sgid) >= 0) {
            return client.message(
                'Willkommen auf unserem Server, bitte registriere dich auf unserer Homepage https://reloaded-life.de/#/register um weitere Funktionen auf diesem TS freizuschalten',
            );
        }
    }
    private clientDisconnect(event: ClientDisconnect) {
        console.log(event.client);
    }
    private async clientMoved(event: ClientMoved) {
        const client = event.client;
        const channel = event.channel;

        // Keine nicht Team Member in Team Channel!

        const isTeamMember = client.servergroups.indexOf(this._teamGroupHandle!.sgid) >= 0;
        if (channel.name.includes('Team') && !isTeamMember) return client.move(this._tsDefaultChannel!.cid);
        return;
    }
    private flooding(error: ResponseError) {
        console.log(error);
    }
    private textMessage(event: TextMessage) {
        console.log(event);
    }
}

new Bot(teamspeak, 'Mayos & Polles Testserver');
