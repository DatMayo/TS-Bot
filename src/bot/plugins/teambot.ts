import { TeamSpeakChannel, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from '..';

/**
 * TeamBot plugin for TS Bot.
 * @param {Bot} bot Handle to the main bot
 */
export class TeamBot {
    private _tsDefaultChannel: TeamSpeakChannel | undefined = undefined;
    private _tsTeamGroup: TeamSpeakServerGroup | undefined = undefined;
    /**
     * Constructor of TeamBot invoces initialization.
     * @param  {Bot} bot Handle to the main bot
     */
    constructor(bot: Bot) {
        this.init(bot);
    }
    /**
     * Initializes TeamBot and sets channels, groups and events.
     * @param  {Bot} bot Handle to the main bot
     */
    private async init(bot: Bot): Promise<void> {
        console.log('[TeamBot] Initialization started');
        this._tsDefaultChannel = await bot.getDefaultChannel();
        this._tsTeamGroup = await bot.getGroupByName(process.env.TS_TEAM_GROUP || 'Team');
        bot.onClientMoved(this.clientMoved.bind(this));
        console.log('[TeamBot] Initialization done');
    }
    /**
     * Function which will be invoked by onClientMoved event
     * @param  {ClientMoved} event ClientMoved event
     */
    private clientMoved(event: ClientMoved): void {
        const client = event.client;
        const channel = event.channel;
        if (!this._tsDefaultChannel || !this._tsTeamGroup) return;
        if (channel.name.includes('Team') && client.servergroups.indexOf(this._tsTeamGroup.sgid) === -1) {
            console.log(`[TeamBot] ${client.nickname} joined a team channel, but he isn't a team member`);
            client.move(this._tsDefaultChannel.cid);
        }
    }
}
