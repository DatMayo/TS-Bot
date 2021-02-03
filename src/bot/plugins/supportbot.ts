import { TSExitCode } from '../utils';
import { TeamSpeakChannel, TeamSpeakClient, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { TeamSpeak } from 'ts3-nodejs-library/lib/TeamSpeak';
import { Bot } from '../bot';
import { ClientConnect, ClientMoved } from 'ts3-nodejs-library/lib/types/Events';

export class SupportBot {
    private _availableSupporter: TeamSpeakClient[] = [];
    private _managedSupportChannelHandles: TeamSpeakChannel[] = [];
    private _teamSpeakHandle: TeamSpeak | undefined;
    private _supportGroupHandle: TeamSpeakServerGroup | undefined;
    private _registrationChannelHandle: TeamSpeakChannel | undefined;
    private _tsTeamGroup: TeamSpeakServerGroup | undefined = undefined;
    protected _tsDefaultChannel: TeamSpeakChannel | undefined;

    constructor(bot: Bot) {
        console.log('[SupportBot] Staging started, please wait');
        this, (this._teamSpeakHandle = bot.teamSpeakHandle);
        bot.onClientMoved(this.clientMoved.bind(this));
        bot.onClientConnect(this.clientConnect.bind(this));
        bot.onClientDisconnect(this.checkSupport.bind(this));

        this.init(bot).then(() => console.log('[SupportBot] Staging ended, SupportBot ready'));
    }

    async init(bot: Bot): Promise<void> {
        if (!this._teamSpeakHandle) return;
        this._tsTeamGroup = await bot.getGroupByName(process.env.TS_TEAM_GROUP || 'Team');
        const _managedSupportChannelNames: string[] = ['Support', 'Termin'];
        const _supportGroupName: string = process.env.TS_SUPPORT_GROUP || 'Bereitschaft';
        const _registrationChannelName: string = process.env.TS_REGISTRATION_CHANNEL || 'An-/Abmeldung';
        if (!this._teamSpeakHandle) return;
        if (!this._tsTeamGroup) return;

        // Check if support group exists and hook it
        this._supportGroupHandle = await this._teamSpeakHandle.getServerGroupByName(_supportGroupName);
        if (!this._supportGroupHandle) return process.exit(TSExitCode.GroupNotFound);
        console.log('[SupportBot] Support group handle added');

        // Check if registration channel exists and can be hooked to
        this._registrationChannelHandle = await this._teamSpeakHandle.getChannelByName(_registrationChannelName);
        if (!this._registrationChannelHandle) return process.exit(TSExitCode.ChannelNotFound);
        console.log('[SupportBot] Registration channel found');

        // Load all defined support channels
        for (const managedSupportChannel of _managedSupportChannelNames) {
            const supportChannelHandle = await this._teamSpeakHandle.getChannelByName(managedSupportChannel);
            if (!supportChannelHandle) continue;
            this._managedSupportChannelHandles.push(supportChannelHandle);
        }
        console.log(
            `[SupportBot] Registered ${this._managedSupportChannelHandles.length}/${_managedSupportChannelNames.length} support channels`,
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

        // Grab handle of the default channel
        this._tsDefaultChannel = (await this._teamSpeakHandle.channelList()).find((item) => item.flagDefault === true);
        if (!this._tsDefaultChannel) return process.exit(TSExitCode.ChannelNotFound);
        console.log(`[SupportBot] Got handle for the default channel`);
    }

    private async clientConnect(event: ClientConnect): Promise<void> {
        if (!this._tsTeamGroup) return;

        const client = event.client;
        if (client.servergroups[0] == '2') return;

        if (client.servergroups.indexOf(this._tsTeamGroup.sgid) !== -1) {
            await this.removeSupportPermission(client);
            await client.message(
                'Hey, du hattest vergessen dir beim letzten mal die Bereitschaftsgruppe zu entfernen. Ich hab das mal für dich gemacht :o)',
            );
            return;
        }
    }

    private async clientMoved(event: ClientMoved): Promise<void> {
        const client = event.client;
        const channel = event.channel;

        // if (this._managedSupportChannelHandles.indexOf(channel) === -1) return;
        if (!this._tsTeamGroup) return;
        if (!this._supportGroupHandle) return;
        if (client.servergroups.indexOf(this._tsTeamGroup.sgid) !== -1) {
            if (channel !== this._registrationChannelHandle) return;
            await this.doTeamRegistration(client);

            //Fun Stuff :-D
            const kick = Boolean(Math.round(Math.random()));
            if (!kick) {
                await this.moveToDefaultChannel(client);
            } else {
                await this.kickToDefaultChannel(client);
            }
        } else {
            // ToDo
            // doUserSupport(client, channel);
        }
    }

    /**
     * Adds the support group to the given client
     * @param  {TeamSpeakClient} client Handle to client
     * @private
     */
    private async addSupportPermission(client: TeamSpeakClient): Promise<boolean> {
        if (this.hasSupportPermission(client)) return false;
        if (!this._supportGroupHandle) return false;
        await client.addGroups(this._supportGroupHandle).catch((err) => {
            console.error(`Could not add group ${this._supportGroupHandle?.name} to user ${client.nickname}.`);
            console.error(`Thrown error was: ${err.message}`);
        });
        return true;
    }
    /**
     * Toggles the registration channel
     * @param  {TeamSpeakClient} client Handle to client
     * @returns Promise<void>
     */
    private async doTeamRegistration(client: TeamSpeakClient): Promise<void> {
        if (this.hasSupportPermission(client)) {
            await this.removeSupportPermission(client);
        } else {
            await this.addSupportPermission(client);
        }
    }

    /**
     * Checks if a client has support permission
     * @param  {TeamSpeakClient} client Handle to client
     * @returns true if the client has support permissions
     * @private
     */
    private hasSupportPermission(client: TeamSpeakClient): boolean {
        if (!this._supportGroupHandle) return false;
        return client.servergroups.indexOf(this._supportGroupHandle?.sgid) >= 0;
    }
    /**
     * Kicks a user to the default channel
     * @param  {TeamSpeakClient} client Handle to client
     * @returns Promise<void>
     */
    private async kickToDefaultChannel(client: TeamSpeakClient): Promise<void> {
        client.kickFromChannel('( ಠ◡ಠ ) Evil james has kicked you');
        return;
    }
    /**
     * Moves a user to the default channel
     * @param  {TeamSpeakClient} client Handle to client
     * @returns Promise<void>
     */
    private async moveToDefaultChannel(client: TeamSpeakClient): Promise<void> {
        if (!this._tsDefaultChannel) return await this.kickToDefaultChannel(client);
        client.move(this._tsDefaultChannel.cid);
        return;
    }

    /**
     * Removes the support group to the given client
     * @param  {TeamSpeakClient} client Handle to client
     * @private
     */
    private async removeSupportPermission(client: TeamSpeakClient): Promise<boolean> {
        if (!this.hasSupportPermission(client)) return false;
        if (!this._supportGroupHandle) return false;
        await client.delGroups(this._supportGroupHandle).catch((err) => {
            console.error(`Could not remove group ${this._supportGroupHandle?.name} for user ${client.nickname}.`);
            console.error(`Thrown error was: ${err.message}`);
        });
        return false;
    }

    private checkSupport() {
        // ToDo
    }
}
