import { TeamSpeakChannel, TeamSpeakClient, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { Bot } from '..';
import { ClientConnect, ClientDisconnect, ClientMoved } from 'ts3-nodejs-library/lib/types/Events';

export class SupportBot {
    private _availableSupporter: TeamSpeakClient[] = [];
    private _managedSupportChannelHandles: TeamSpeakChannel[] = [];
    private _tsDefaultChannel: TeamSpeakChannel | undefined = undefined;
    private _registerChannelHandle: TeamSpeakChannel | undefined = undefined;
    private _supportGroupHandle: TeamSpeakServerGroup | undefined = undefined;
    private _teamGroupHandle: TeamSpeakServerGroup | undefined = undefined;
    /**
     * Constructor of SupportBot invoces initialization.
     * @param {Bot} bot Handle to the main bot
     */
    constructor(bot: Bot) {
        this.init(bot);
    }
    /**
     * Initializes SupportBot and sets channels, groups and events.
     * @param {Bot} bot Handle to the main bot
     */
    async init(bot: Bot): Promise<void> {
        console.log('[SupportBot] Initialization started');
        this._teamGroupHandle = await bot.getGroupByName(process.env.TS_TEAM_GROUP || 'Team');
        this._supportGroupHandle = await bot.getGroupByName(process.env.TS_SUPPORT_GROUP || 'Bereitschaft');
        this._tsDefaultChannel = await bot.getDefaultChannel();
        this._registerChannelHandle = await bot.getChannelByName(
            process.env.TS_REGISTRATION_CHANNEL || 'An-/Abmeldung',
        );
        for (const managedSupportChannel of ['Support', 'Termin']) {
            this._managedSupportChannelHandles.push(await bot.getChannelByName(managedSupportChannel));
        }
        for (const client of await bot.teamSpeakHandle.clientList()) {
            if (
                client.servergroups.indexOf(this._teamGroupHandle.sgid) !== -1 &&
                client.servergroups.indexOf(this._supportGroupHandle.sgid) !== -1
            ) {
                this._availableSupporter.push(client);
            }
        }
        bot.onClientMoved(this.clientMoved.bind(this));
        bot.onClientConnect(this.clientConnect.bind(this));
        bot.onClientDisconnect(this.clientDisconnect.bind(this));
        console.log('[SupportBot] Initialization done');
    }
    // TODO --- refactored until here, new refactoring starting here
    private async clientConnect(event: ClientConnect): Promise<void> {
        if (!this._teamGroupHandle) return;
        if (!this._supportGroupHandle) return;

        const client = event.client;
        if (client.servergroups[0] == '2') return;

        if (client.servergroups.indexOf(this._supportGroupHandle.sgid) !== -1) {
            await this.removeSupportPermission(client);
            await client.message(
                'Hey, du hattest vergessen dir beim letzten mal die Bereitschaftsgruppe zu entfernen. Ich hab das mal für dich gemacht :o)',
            );
            return;
        }
    }

    private async clientDisconnect(event: ClientDisconnect): Promise<void> {
        const client = event.client;
        if (!client) return;
        if (!this._teamGroupHandle) return;

        if (client.servergroups.indexOf(this._teamGroupHandle.sgid) === -1) return;

        const idx = this._availableSupporter.indexOf(client);
        if (idx === -1) return;
        this._availableSupporter.splice(idx);
        console.log(
            `[SupportBot] ${client.nickname} was registered as supporter on standby, I removed him because he disconnected.`,
        );
        console.log(`[SupportBot] There are/is now a total of ${this._availableSupporter.length} supporter on standby`);
    }

    private async clientMoved(event: ClientMoved): Promise<void> {
        const client = event.client;
        const channel = event.channel;

        // if (this._managedSupportChannelHandles.indexOf(channel) === -1) return;
        if (!this._teamGroupHandle) return;
        if (!this._supportGroupHandle) return;
        if (client.servergroups.indexOf(this._teamGroupHandle.sgid) !== -1) {
            if (channel !== this._registerChannelHandle) return;
            await this.doTeamRegistration(client);

            //Fun Stuff :-D
            const kick = Boolean(Math.round(Math.random()));
            if (!kick) {
                await this.moveToDefaultChannel(client);
            } else {
                await this.kickToDefaultChannel(client);
            }
            console.log(
                `[SupportBot] There are/is now a total of ${this._availableSupporter.length} supporter on standby`,
            );
        } else {
            this.checkSupport(client, channel);
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
        console.log(`[SupportBot] ${client.nickname} is now on standby`);
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
            const idx = this._availableSupporter.indexOf(client);
            if (idx !== -1) this._availableSupporter.splice(idx);
        } else {
            await this.addSupportPermission(client);
            this._availableSupporter.push(client);
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
            console.log(`[SupportBot] ${client.nickname} is not on on standby anymore`);
        });
        return false;
    }

    /**
     * Checks for available support options
     * @param  {TeamSpeakClient} client Handle to client
     * @param  {TeamSpeakChannel} channel Handle to client channel
     */
    private async checkSupport(client: TeamSpeakClient, channel: TeamSpeakChannel) {
        if (client.type != 0) return;
        if (this._managedSupportChannelHandles.length === 0) return;
        const foundChannel = this._managedSupportChannelHandles.find((item) => item.cid === channel.cid);
        if (!foundChannel) return;
        if (this._availableSupporter.length === 0) {
            return client.message(
                'Es ist aktuell kein Supporter im Dienst. Du kannst warten oder gern zu einem späteren Zeitpunkt zurück kommen',
            );
        }

        await client.message('Willkommen im Wartebereich,');
        await client.message('bitte fordere Talkpower an, damit wir dein Anliegen schnellstmöglich bearbeiten können.');

        for (const supporter of this._availableSupporter) {
            await supporter.message(
                `[URL=client://${client.clid}/${client.uniqueIdentifier}]${client.nickname}[/URL] wartet in [URL=channelid://${channel.cid}]${channel.name}[/URL], bitte kümmere dich um Ihn, sobald er/sie Talkpower angefordert hat`,
            );
        }

        setTimeout(
            async () => {
                if (!client) return;
                if (client.cid !== channel.cid) return;
                const info = await client.getInfo();
                if (!info.clientTalkRequest) {
                    client.message(
                        'Bitte gib einen Grund an, weswegen du mit uns sprechen möchtest. Andernfalls können wir dir nicht helfen.',
                    );
                }
            },
            30 * 1000,
            channel,
        );

        setTimeout(
            async () => {
                if (!client) return;
                if (client.cid !== channel.cid) return;
                const info = await client.getInfo();
                if (!info.clientTalkRequest) {
                    client.message(
                        'Da du noch keine Talk Power angefordert hast, gehen wir davon aus das sich dein Anliegen erledigt hat. Sollte dies nicht der Fall sein, schau einfach nochmal in unserem Wartebereich vorbei.',
                    );
                    this.moveToDefaultChannel(client);
                }
            },
            2 * 60 * 1000,
            channel,
        );
    }
}
