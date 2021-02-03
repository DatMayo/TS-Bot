import { TSExitCode } from '../../enums';
import { TeamSpeakChannel, TeamSpeakClient, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { TeamSpeak } from 'ts3-nodejs-library/lib/TeamSpeak';
import { Bot } from '../bot';

export class SupportBot {
    private _availableSupporter: TeamSpeakClient[] = [];
    private _managedSupportChannelNames: string[] = ['Support', 'Termin'];
    private _managedSupportChannelHandles: TeamSpeakChannel[] = [];
    private _teamSpeakHandle: TeamSpeak | undefined;
    private _supportGroupHandle: TeamSpeakServerGroup | undefined;
    private _supportGroupName: string = process.env.TS_SUPPORT_GROUP || 'Bereitschaft';
    private _registrationChannel: TeamSpeakChannel | undefined;
    private _registrationChannelName: string = process.env.TS_REGISTRATION_CHANNEL || 'crash';
    private _tsTeamGroup: TeamSpeakServerGroup | undefined = undefined;

    constructor(bot: Bot) {
        console.log('[SupportBot] Staging started, please wait');
        this, (this._teamSpeakHandle = bot.teamSpeakHandle);
        bot.onClientMoved(this.checkSupport.bind(this));
        bot.onClientConnect(this.checkSupport.bind(this));
        bot.onClientDisconnect(this.checkSupport.bind(this));

        this.init(bot).then(() => console.log('[SupportBot] Staging ended, SupportBot ready'));
    }

    async init(bot: Bot): Promise<void> {
        if (!this._teamSpeakHandle) return;
        this._tsTeamGroup = await bot.getGroupByName(process.env.TS_TEAM_GROUP || 'Team');
        if (!this._teamSpeakHandle) return;
        if (!this._tsTeamGroup) return;

        // Check if support group exists and hook it
        this._supportGroupHandle = await this._teamSpeakHandle.getServerGroupByName(this._supportGroupName);
        if (!this._supportGroupHandle) return process.exit(TSExitCode.GroupNotFound);
        console.log('[SupportBot] Support group handle added');

        // Check if registration channel exists and can be hooked to
        this._registrationChannel = await this._teamSpeakHandle.getChannelByName(this._registrationChannelName);
        if (!this._registrationChannel) return process.exit(TSExitCode.ChannelNotFound);
        console.log('[SupportBot] Registration channel found');

        // Load all defined support channels
        for (const mannagedSupportChannel of this._managedSupportChannelNames) {
            const supportChannelHandle = await this._teamSpeakHandle.getChannelByName(mannagedSupportChannel);
            if (!supportChannelHandle) continue;
            this._managedSupportChannelHandles.push(supportChannelHandle);
        }
        console.log(
            `[SupportBot] Registered ${this._managedSupportChannelHandles.length}/${this._managedSupportChannelNames.length} support channels`,
        );

        // Load all current connected supporter
        const clientList = await this._teamSpeakHandle.clientList();
        for (const client of clientList) {
            if (client.servergroups.indexOf(this._tsTeamGroup.sgid) === -1) continue;
            if (!this._supportGroupHandle) continue;
            if (client.servergroups.indexOf(this._supportGroupHandle.sgid) === -1) continue;

            this._availableSupporter.push(client);
        }
        console.log(`[SupportBot] Found ${this._availableSupporter.length} Supporter while staging in progress`);
    }

    private checkSupport() {
        // ToDo
    }
}
