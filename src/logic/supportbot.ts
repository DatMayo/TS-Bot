import { TSExitCode } from '../enums';
import { TeamSpeak, TeamSpeakChannel, TeamSpeakClient, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { ClientDisconnect, ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from './bot';

export class SupportBot extends Bot {
    private _supportChannelName: string[] = ['Support', 'Termin'];
    private _supportChannelHandle: TeamSpeakChannel[] = [];
    private _supportGroupName: string = process.env.TS_SUPPORT_GROUP || 'Bereitschaft';
    private _supportGroupHandle: TeamSpeakServerGroup | undefined;
    private _registrationChannel: TeamSpeakChannel | undefined;
    private _registrationChannelName: string = process.env.TS_REGISTRATION_CHANNEL || 'crash';
    private _availableSupporter: TeamSpeakClient[] = [];
    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        super(teamSpeakHandle, serverName);
        console.log('[SupportBot] Staging started, please wait');
        let stage = 0;
        const check = setInterval(async () => {
            // Load support group
            try {
                if (stage == 0) {
                    this._supportGroupHandle = await this._teamSpeakHandle.getServerGroupByName(this._supportGroupName);
                    if (!this._supportGroupHandle) return process.exit(TSExitCode.SupportGroupNotFound);
                    stage = 1;
                }
            } catch (err) {
                if (err.message == 'invalid serverID') return;
                else console.log(err);
            }

            // Load registration group
            try {
                if (stage == 1) {
                    this._registrationChannel = await this._teamSpeakHandle.getChannelByName(
                        this._registrationChannelName,
                    );
                    if (!this._registrationChannel) return process.exit(TSExitCode.RegistrationChannelNotFound);
                    stage = 2;
                }
            } catch (err) {
                console.log(err);
            }

            // Load support channel
            try {
                if (stage == 2) {
                    this._supportChannelHandle = [];
                    for (const supportChannel of this._supportChannelName) {
                        const channel = await this._teamSpeakHandle.getChannelByName(supportChannel);
                        if (!channel) continue;

                        //Bug ?
                        const idx = this._supportChannelHandle.indexOf(channel);
                        if (idx === -1) this._supportChannelHandle.push(channel);
                    }
                    stage = 3;
                }
            } catch (err) {
                console.log(err);
            }

            // Load current connected supporter
            try {
                if (stage == 3) {
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
                    stage = 4;
                }
            } catch (err) {
                console.log(err);
            }

            if (stage == 4) {
                console.log('[SupportBot] Staging complete, Supportbot ready');

                clearInterval(check);
            }
            return;
        }, 5000);
    }

    clientDisconnect(event: ClientDisconnect): void {
        if (!event.client) return;
        const client = event.client;

        if (!this._supportGroupHandle) return;
        const isOnStandby = client.servergroups.indexOf(this._supportGroupHandle.sgid) >= 0;

        if (!this.isTeamMember(client)) return;
        if (isOnStandby) this.doTeamRegistration(client, this._registrationChannel as TeamSpeakChannel);
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
            if (!client) return;
            if (client.cid !== channel.cid) return;

            const info = await client.getInfo();
            if (!info.clientTalkRequest)
                client.message(
                    'Bitte gib einen Grund an, weswegen du mit uns sprechen möchtest. Andernfalls können wir dir nicht helfen.',
                );
        }, 30000);

        // Keine TP nach 90 Sekunden
        setTimeout(async () => {
            if (!client) return;
            if (client.cid !== channel.cid) return;

            const info = await client.getInfo();
            if (!info.clientTalkRequest)
                client.message(
                    'Da du noch keine Talk Power angefordert hast, gehen wir davon aus das sich dein Anliegen erledigt hat. Sollte dies nicht der Fall sein, schau einfach nochmal in unserem Wartebereich vorbei.',
                );
            this.moveToDefaultChannel(client);
        }, 90000);
    }
    doTeamRegistration(client: TeamSpeakClient, channel: TeamSpeakChannel): void {
        if (channel !== this._registrationChannel) return;

        if (!this._supportGroupHandle) return;
        const isOnStandby = client.servergroups.indexOf(this._supportGroupHandle.sgid) >= 0;

        if (!isOnStandby) {
            client.addGroups(this._supportGroupHandle);
            client.message('Du bist nun als Supporter in Bereitschaft registiert');

            const idx = this._availableSupporter.indexOf(client);
            if (idx !== -1) this._availableSupporter.push(client);
        } else {
            client.delGroups(this._supportGroupHandle);
            const idx = this._availableSupporter.indexOf(client);
            if (idx !== -1) this._availableSupporter.splice(idx, 1);
            client.message('Du bist nun nicht mehr als Supporter in Bereitschaft registiert');
        }
        setTimeout(() => this.moveToDefaultChannel(client), 2000);
        return;
    }
}
