import { TSExitCode } from '../enums';
import { TeamSpeak, TeamSpeakChannel, TeamSpeakClient, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from './bot';

export class SupportBot extends Bot {
    private _supportChannelName: string[] = ['Support', 'Termin', 'Whitelist'];
    private _supportChannelHandle: TeamSpeakChannel[] = [];
    private _supportGroupName: string = process.env.TS_SUPPORT_GROUP || 'Bereitschaft';
    private _supportGroupHandle: TeamSpeakServerGroup | undefined;
    private _registrationChannel: TeamSpeakChannel | undefined;
    private _registrationChannelName: string = process.env.TS_REGISTRATION_CHANNEL || 'crash';
    private _availableSupporter: TeamSpeakClient[] = [];
    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        super(teamSpeakHandle, serverName);
        const check = setInterval(async () => {
            try {
                if (!this._supportGroupHandle || !this._registrationChannel) {
                    this._supportGroupHandle = await this._teamSpeakHandle.getServerGroupByName(this._supportGroupName);
                    if (!this._supportGroupHandle) return process.exit(TSExitCode.SupportGroupNotFound);

                    this._registrationChannel = await this._teamSpeakHandle.getChannelByName(
                        this._registrationChannelName,
                    );
                    if (!this._registrationChannel) return process.exit(TSExitCode.RegistrationChannelNotFound);

                    this._supportChannelHandle = [];
                    for (const supportChannel of this._supportChannelName) {
                        const channel = await this._teamSpeakHandle.getChannelByName(supportChannel);
                        if (!channel) continue;

                        //Bug
                        const idx = this._supportChannelHandle.indexOf(channel);
                        if (idx === -1) this._supportChannelHandle.push(channel);
                    }

                    this._availableSupporter = [];
                    const clientList = await this._teamSpeakHandle.clientList();
                    for (const client of clientList) {
                        if (!this.isTeamMember(client)) continue;
                        if (client.servergroups.indexOf(this._supportGroupHandle.sgid) === -1) return;
                        this._availableSupporter.push(client);
                    }
                    clearInterval(check);
                }
            } catch (err) {
                if (err.message == 'invalid serverID') return;
                else console.log(err);
            }
            return;
        }, 100);
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
            if (client.cid !== channel.cid) return;

            const info = await client.getInfo();
            if (!info.clientTalkRequest)
                client.message(
                    'Bitte gib einen Grund an, weswegen du mit uns sprechen möchtest. Andernfalls können wir dir nicht helfen.',
                );
        }, 30000);

        // Keine TP nach 90 Sekunden
        setTimeout(async () => {
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
            client.addGroups(this._supportGroupHandle.sgid);
            client.message('Du bist nun als Supporter in Bereitschaft registiert');
            this._availableSupporter.push(client);
        } else {
            client.delGroups(this._supportGroupHandle.sgid);
            const idx = this._availableSupporter.indexOf(client);
            if (idx !== -1) this._availableSupporter.slice(idx, 1);
            client.message('Du bist nun nicht mehr als Supporter in Bereitschaft registiert');
        }
        setTimeout(() => this.moveToDefaultChannel(client), 2000);
        return;
    }
}
