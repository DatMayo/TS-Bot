import * as dotenv from 'dotenv';
import {
    ResponseError,
    TeamSpeak,
    TeamSpeakChannel,
    TeamSpeakClient,
    TeamSpeakServer,
    TeamSpeakServerGroup,
} from 'ts3-nodejs-library';
import { ClientConnect, ClientDisconnect, ClientMoved, TextMessage } from 'ts3-nodejs-library/lib/types/Events';
import { TSExitCode } from '../bot/utils';

dotenv.config();

export class Bot {
    protected _teamSpeakHandle: TeamSpeak;
    protected _guestGroupName: string = process.env.TS_GUEST_GROUP || 'Guest';
    protected _guestGroupHandle: TeamSpeakServerGroup | undefined;
    protected _connectionComplete = false;
    protected _tsDefaultChannel: TeamSpeakChannel | undefined;
    protected _teamGroupName: string = process.env.TS_TEAM_GROUP || 'Team';
    protected _teamGroupHandle: TeamSpeakServerGroup | undefined;
    private _serverName: string;

    /**
     * Creates a new TS Bot instance
     * @param {TeamSpeak} teamSpeakHandle Handle to a connected server
     * @param {string} serverName Name of the server, which will be selected
     */
    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        this._teamSpeakHandle = teamSpeakHandle;
        this._serverName = serverName;
        this._teamSpeakHandle.on('ready', this.connectToServer.bind(this));
    }

    private async connectToServer(): Promise<void> {
        const teamSpeakServerHandle = (await this._teamSpeakHandle.serverList()).find(
            (item: TeamSpeakServer) => item.name === this._serverName,
        );
        if (!teamSpeakServerHandle) return process.exit(TSExitCode.VirtualServerNotFound);
        teamSpeakServerHandle.use(process.env.TS_NICKNAME || 'serveradmin');
        this._teamSpeakHandle.useBySid(teamSpeakServerHandle.id);

        this._tsDefaultChannel = (await this._teamSpeakHandle.channelList()).find((item) => item.flagDefault === true);
        if (!this._tsDefaultChannel) return process.exit(TSExitCode.ChannelNotFound);

        this._teamGroupHandle = await this._teamSpeakHandle.getServerGroupByName(this._teamGroupName);
        if (!this._teamGroupHandle) return process.exit(TSExitCode.GroupNotFound);

        this._guestGroupHandle = await this._teamSpeakHandle.getServerGroupByName(this._guestGroupName);
        if (!this._guestGroupHandle) return process.exit(TSExitCode.GroupNotFound);

        this._connectionComplete = true;

        this._teamSpeakHandle.on('clientconnect', this.clientConnect.bind(this));
        this._teamSpeakHandle.on('clientdisconnect', this.clientDisconnect.bind(this));
        this._teamSpeakHandle.on('clientmoved', this.clientMoved.bind(this));
        this._teamSpeakHandle.on('flooding', this.flooding.bind(this));
        this._teamSpeakHandle.on('textmessage', this.textMessage.bind(this));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected clientConnect(_event: ClientConnect): void {
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected clientDisconnect(_event: ClientDisconnect): void {
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected clientMoved(_event: ClientMoved): void {
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected textMessage(_event: TextMessage): void {
        return;
    }

    private flooding(error: ResponseError) {
        console.log(error);
    }
    /**
     * Checks if the given client is a team member
     * @param {TeamSpeakClient} client Client to check
     * @returns boolean Returns false, if the given client is not a team member
     */
    isTeamMember(client: TeamSpeakClient): boolean {
        if (!this._teamGroupHandle) return false;
        return client.servergroups.indexOf(this._teamGroupHandle.sgid) >= 0;
    }
    /**
     * Moves a client back to the default channel
     * @param {TeamSpeakClient} client Client handle
     * @returns void
     */
    moveToDefaultChannel(client: TeamSpeakClient): void {
        if (!this._tsDefaultChannel) return;
        client.move(this._tsDefaultChannel.cid);
        return;
    }

    /**
     * Converts unix time into human readable time
     * @param  {number} timestamp UNIX timestamp
     * @returns string Date in dd. MMM yyyy HH:ii:ss
     */
    timeConverter(timestamp: number): string {
        const a = new Date(timestamp * 1000);
        const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        const year = a.getFullYear();
        const month = months[a.getMonth()];
        const date = a.getDate();
        const hour = a.getHours();
        const min = a.getMinutes();
        const sec = a.getSeconds();
        const time = date + ' ' + month + '. ' + year + ' ' + hour + ':' + min + ':' + sec;
        return time;
    }
}
