import { TSExitCode } from '../enums';
import { TeamSpeak, TeamSpeakChannel, TeamSpeakClient, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { ClientConnect, ClientDisconnect, ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from './bot';

export class SupportBot extends Bot {
    private _supportChannelName: string[] = ['Support', 'Termin'];
    private _supportChannelHandle: TeamSpeakChannel[] = [];
    private _supportGroupName: string = process.env.TS_SUPPORT_GROUP || 'Bereitschaft';
    private _supportGroupHandle: TeamSpeakServerGroup | undefined;
    private _registrationChannel: TeamSpeakChannel | undefined;
    private _registrationChannelName: string = process.env.TS_REGISTRATION_CHANNEL || 'crash';
    private _availableSupporter: TeamSpeakClient[] = [];
    private _stageCheck: NodeJS.Timeout;

    private _currentStage = 0;
    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        super(teamSpeakHandle, serverName);
        console.log('[SupportBot] Staging started, please wait');
        this._stageCheck = setInterval(this.startStagingProcess.bind(this), 5000);
    }

    private async startStagingProcess(): Promise<void> {
        // Load support group
        try {
            if (this._currentStage == 0) {
                this._supportGroupHandle = await this._teamSpeakHandle.getServerGroupByName(this._supportGroupName);
                if (!this._supportGroupHandle) return process.exit(TSExitCode.GroupNotFound);
                this._currentStage = 1;
                console.log('[SupportBot] Support group handle added');
            }
        } catch (err) {
            if (err.message == 'invalid serverID') return;
            else console.log(err);
        }

        // Load registration group
        try {
            if (this._currentStage == 1) {
                this._registrationChannel = await this._teamSpeakHandle.getChannelByName(this._registrationChannelName);
                if (!this._registrationChannel) return process.exit(TSExitCode.ChannelNotFound);
                this._currentStage = 2;
                console.log('[SupportBot] Registration channel found');
            }
        } catch (err) {
            console.log(err);
        }

        // Load support channel
        try {
            if (this._currentStage == 2) {
                this._supportChannelHandle = [];
                for (const supportChannel of this._supportChannelName) {
                    const channel = await this._teamSpeakHandle.getChannelByName(supportChannel);
                    if (!channel) continue;

                    //Bug ?
                    const idx = this._supportChannelHandle.indexOf(channel);
                    if (idx === -1) this._supportChannelHandle.push(channel);
                }
                this._currentStage = 3;
                console.log(
                    `[SupportBot] Registered ${this._supportChannelHandle.length}/${this._supportChannelName.length} support channels`,
                );
            }
        } catch (err) {
            console.log(err);
        }

        // Load current connected supporter
        try {
            if (this._currentStage == 3) {
                this._availableSupporter = [];
                const clientList = await this._teamSpeakHandle.clientList();
                for (const client of clientList) {
                    if (!this.isTeamMember(client)) continue;
                    if (!this._supportGroupHandle) continue;
                    if (client.servergroups.indexOf(this._supportGroupHandle.sgid) === -1) continue;

                    //Bug ?
                    const idx = this._availableSupporter.indexOf(client);
                    if (idx === -1) this._availableSupporter.push(client);
                }
                this._currentStage = 4;
                console.log(
                    `[SupportBot] Found ${this._availableSupporter.length} Supporter while staging in progress`,
                );
            }
        } catch (err) {
            console.log(err);
        }

        if (this._currentStage == 4) {
            console.log('[SupportBot] Staging complete, Supportbot ready');

            clearInterval(this._stageCheck);
        }
        return;
    }

    clientConnect(event: ClientConnect): void {
        const client = event.client;

        // Server Query Clients
        if (client.servergroups[0] == '2') return;

        if (!this.isTeamMember(client)) return;

        if (!this._supportGroupHandle) return;
        if (client.servergroups.indexOf(this._supportGroupHandle.sgid) === -1) return;

        this.doTeamRegistration(client, this._registrationChannel as TeamSpeakChannel, 0);
    }
    clientDisconnect(event: ClientDisconnect): void {
        if (!event.client) return;
        const client = event.client;

        // Server Query Clients
        if (client.servergroups[0] == '2') return;

        if (!this.isTeamMember(client)) return;

        if (!this._supportGroupHandle) return;
        if (client.servergroups.indexOf(this._supportGroupHandle.sgid) === -1) {
            // For some weired reason, sometimes client.servergroups differ 1 group
            const idx = this._availableSupporter.indexOf(client);
            if (idx !== -1) this._availableSupporter.splice(idx, 1);
            return;
        }

        this.doTeamRegistration(client, this._registrationChannel as TeamSpeakChannel, 0);
    }

    clientMoved(event: ClientMoved): void {
        const client = event.client;
        const channel = event.channel;

        if (this.isTeamMember(client)) this.doTeamRegistration(client, channel);
        else this.doUserSupport(client, channel);
    }

    doUserSupport(client: TeamSpeakClient, channel: TeamSpeakChannel): void {
        const channelCheck = this._supportChannelHandle.find((item) => item.name === channel.name);
        if (!channelCheck) return;
        if (this._availableSupporter.length === 0)
            return client.message(
                'Es ist aktuell kein Supporter im Dienst. Du kannst warten oder gern zu einem späteren Zeitpunkt zurück kommen',
            );
        client.message('Willkommen im Wartebereich,');
        client.message('bitte fordere Talkpower an, damit wir dein Anliegen schnellstmöglich bearbeiten können.');
        for (const supporter of this._availableSupporter) {
            supporter.message(
                `${client.nickname} wartet in ${channel.name}, bitte kümmere dich um Ihn, sobald er/sie Talkpower angefordert hat`,
            );
        }

        // Keine TP nach 30 Sekunden
        setTimeout(async () => {
            try {
                if (!client) return;
                if (client.cid !== channel.cid) return;

                const info = await client.getInfo();
                if (!info.clientTalkRequest)
                    client.message(
                        'Bitte gib einen Grund an, weswegen du mit uns sprechen möchtest. Andernfalls können wir dir nicht helfen.',
                    );
            } catch (ex) {
                console.log(ex.message);
            }
        }, 30000);

        // Keine TP nach 90 Sekunden
        setTimeout(async () => {
            try {
                if (!client) return;
                if (client.cid !== channel.cid) return;

                const info = await client.getInfo();
                if (!info.clientTalkRequest)
                    client.message(
                        'Da du noch keine Talk Power angefordert hast, gehen wir davon aus das sich dein Anliegen erledigt hat. Sollte dies nicht der Fall sein, schau einfach nochmal in unserem Wartebereich vorbei.',
                    );
            } catch (ex) {
                console.log(ex.message);
            }
            this.moveToDefaultChannel(client);
        }, 90000);
    }
    doTeamRegistration(client: TeamSpeakClient, channel: TeamSpeakChannel, timeout = 2000): void {
        if (channel !== this._registrationChannel) return;
        if (!this._supportGroupHandle) return;

        const isOnStandby = client.servergroups.indexOf(this._supportGroupHandle.sgid) >= 0;

        if (!isOnStandby) {
            client.addGroups(this._supportGroupHandle).catch((err) => {
                console.error(`Could not add ${client.nickname} to ${this._supportGroupHandle?.name} group.`);
                console.error(`Thrown error was: ${err.message}`);
            });
            client.message('Du bist nun als Supporter in Bereitschaft registiert');

            const idx = this._availableSupporter.indexOf(client);
            if (idx !== -1) this._availableSupporter.push(client);
        } else {
            client.delGroups(this._supportGroupHandle).catch((err) => {
                console.error(`Could not remove group ${this._supportGroupHandle?.name} for user ${client.nickname}.`);
                console.error(`Thrown error was: ${err.message}`);
            });
            const idx = this._availableSupporter.indexOf(client);
            if (idx !== -1) this._availableSupporter.splice(idx, 1);
            client.message('Du bist nun nicht mehr als Supporter in Bereitschaft registiert');
        }
        if (timeout > 0) setTimeout(() => this.moveToDefaultChannel(client), timeout);
        return;
    }
}
