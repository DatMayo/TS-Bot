import { TeamSpeak, TeamSpeakChannel, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { TSExitCode } from './utils';

export class Bot {
    private _teamSpeakHandle: TeamSpeak;
    /**
     * Constructor of Bot invoces initialization.
     * @param {TeamSpeak} teamSpeakHandle Handle of the teamspeak
     */
    public constructor(teamSpeakHandle: TeamSpeak) {
        this._teamSpeakHandle = teamSpeakHandle;
        this._teamSpeakHandle.on('ready', this.init.bind(this));
        //eslint-disable-next-line
        this._teamSpeakHandle.on('error', () => {});
    }
    /**
     * Returns a handle to the teamspeak
     * @returns TeamSpeak Handle
     */
    get teamSpeakHandle(): TeamSpeak {
        return this._teamSpeakHandle;
    }
    /**
     * Initializes Bot and sets server and nickname.
     */
    private async init() {
        if (!this._teamSpeakHandle.config.serverport || !this._teamSpeakHandle.config.nickname) return;
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
}
