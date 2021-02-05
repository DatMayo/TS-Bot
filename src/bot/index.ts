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
    /**
     * Returns a handle to the default TS Channel
     * @returns Promise<TeamSpeakChannel> Handle of the default channel
     */
    public async getDefaultChannel(): Promise<TeamSpeakChannel> {
        const defaultChannel = (await this._teamSpeakHandle.channelList()).find((item) => item.flagDefault === true);
        if (!defaultChannel) return process.exit(TSExitCode.ChannelNotFound);
        return defaultChannel;
    }
    /**
     * Gets a channel for the given channelname
     * @param  {string} name Name to search for
     * @returns Promise<TeamSpeakChannel> Handle of the searched channel
     */
    public async getChannelByName(name: string): Promise<TeamSpeakChannel> {
        const channel = await this._teamSpeakHandle.getChannelByName(name);
        if (!channel) return process.exit(TSExitCode.ChannelNotFound);
        return channel;
    }
    /**
     * Gets a channel group by the given name
     * @param  {string} name Name to search for
     * @returns Promise<TeamSpeakServerGroup> Handle to the server group
     */
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
