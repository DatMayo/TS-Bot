import { TeamSpeakChannel, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from '../bot';

export class TeamBot {
    private _tsDefaultChannel: TeamSpeakChannel | undefined = undefined;
    private _tsTeamGroup: TeamSpeakServerGroup | undefined = undefined;
    constructor(bot: Bot) {
        this.init(bot);
    }
    private async init(bot: Bot) {
        this._tsDefaultChannel = await bot.getDefaultChannel();
        this._tsTeamGroup = await bot.getGroupByName(process.env.TS_TEAM_GROUP || 'Team');
        bot.onClientMoved(this.clientMoved.bind(this));
        console.log('[TeamBot] TeamBot started');
    }
    private clientMoved(event: ClientMoved): void {
        const client = event.client;
        const channel = event.channel;

        if (!this._tsDefaultChannel) return;
        if (!this._tsTeamGroup) return;

        if (channel.name.includes('Team') && client.servergroups) {
            console.log(`[TeamBot] ${client.nickname} joined a team channel, but he isn't a team member`);
            client.move(this._tsDefaultChannel.cid);
        }
    }
}
