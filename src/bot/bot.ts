import { TeamSpeak, TeamSpeakServer, TeamSpeakChannel, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { TSExitCode } from '../enums';

export class Bot {
    private _teamSpeakHandle: TeamSpeak;
    public constructor(teamSpeakHandle: TeamSpeak) {
        this._teamSpeakHandle = teamSpeakHandle;
        this._teamSpeakHandle.on('ready', this.init.bind(this));
    }
    private async init() {
        const teamSpeakServerHandle = (await this._teamSpeakHandle.serverList()).find(
            (item: TeamSpeakServer) => item.port === this._teamSpeakHandle.config.serverport,
        );
        if (!teamSpeakServerHandle) return process.exit(TSExitCode.VirtualServerNotFound);
        teamSpeakServerHandle.use(process.env.TS_NICKNAME || 'serveradmin');
        this._teamSpeakHandle.useBySid(teamSpeakServerHandle.id);
        return;
    }
    public async getDefaultChannel(): Promise<TeamSpeakChannel> {
        const defaultChannel = (await this._teamSpeakHandle.channelList()).find((item) => item.flagDefault === true);
        if (!defaultChannel) return process.exit(TSExitCode.DefaultChannelNotFound);
        return defaultChannel;
    }
    public async getGroupByName(name: string): Promise<TeamSpeakServerGroup> {
        const group = await this._teamSpeakHandle.getServerGroupByName(name);
        if (!group) return process.exit(TSExitCode.GroupNotFound);
        return group;
    }

    public onClientMoved(func: (event: ClientMoved) => void): void {
        this._teamSpeakHandle.on('clientmoved', func);
    }
}
