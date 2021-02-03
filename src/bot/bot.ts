import { TeamSpeak, TeamSpeakChannel, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { ClientConnect, ClientDisconnect, ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { TSExitCode } from './utils';

export class Bot {
    private _teamSpeakHandle: TeamSpeak;
    public constructor(teamSpeakHandle: TeamSpeak) {
        this._teamSpeakHandle = teamSpeakHandle;
        this._teamSpeakHandle.on('ready', this.init.bind(this));
    }

    get teamSpeakHandle(): TeamSpeak {
        return this._teamSpeakHandle;
    }

    private async init() {
        if (!this._teamSpeakHandle.config.serverport) return;
        await this._teamSpeakHandle.useByPort(
            this._teamSpeakHandle.config.serverport,
            this._teamSpeakHandle.config.nickname,
        );
    }

    public async getDefaultChannel(): Promise<TeamSpeakChannel> {
        const defaultChannel = (await this._teamSpeakHandle.channelList()).find((item) => item.flagDefault === true);
        if (!defaultChannel) return process.exit(TSExitCode.ChannelNotFound);
        return defaultChannel;
    }

    public async getGroupByName(name: string): Promise<TeamSpeakServerGroup> {
        const group = await this._teamSpeakHandle.getServerGroupByName(name);
        if (!group) return process.exit(TSExitCode.GroupNotFound);
        return group;
    }

    public onClientConnect(func: (event: ClientConnect) => void): void {
        this._teamSpeakHandle.on('clientconnect', func);
    }

    public onClientDisconnect(func: (event: ClientDisconnect) => void): void {
        this._teamSpeakHandle.on('clientdisconnect', func);
    }

    public onClientMoved(func: (event: ClientMoved) => void): void {
        this._teamSpeakHandle.on('clientmoved', func);
    }
}
