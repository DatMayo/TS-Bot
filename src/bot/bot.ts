import { TeamSpeak, TeamSpeakChannel, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { ClientConnect, ClientDisconnect, ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { TSExitCode } from '../enums';

export class Bot {
    private _teamSpeak: TeamSpeak;
    public constructor(teamSpeakHandle: TeamSpeak) {
        this._teamSpeak = teamSpeakHandle;
        this._teamSpeak.on('ready', this.init.bind(this));
    }
    private async init() {
        if (!this._teamSpeak.config.serverport) return;
        await this._teamSpeak.useByPort(this._teamSpeak.config.serverport, process.env.TS_NICKNAME || 'serveradmin');
    }
    public async getDefaultChannel(): Promise<TeamSpeakChannel> {
        const defaultChannel = (await this._teamSpeak.channelList()).find((item) => item.flagDefault === true);
        if (!defaultChannel) return process.exit(TSExitCode.ChannelNotFound);
        return defaultChannel;
    }
    public async getGroupByName(name: string): Promise<TeamSpeakServerGroup> {
        const group = await this._teamSpeak.getServerGroupByName(name);
        if (!group) return process.exit(TSExitCode.GroupNotFound);
        return group;
    }

    public onClientConnect(func: (event: ClientConnect) => void): void {
        this._teamSpeak.on('clientconnect', func);
    }

    public onClientDisconnect(func: (event: ClientDisconnect) => void): void {
        this._teamSpeak.on('clientdisconnect', func);
    }

    public onClientMoved(func: (event: ClientMoved) => void): void {
        this._teamSpeak.on('clientmoved', func);
    }
}
