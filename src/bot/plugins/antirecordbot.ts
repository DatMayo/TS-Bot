import { TeamSpeak, TeamSpeakClient } from 'ts3-nodejs-library';
import { Bot } from '../bot';
interface IWarnList {
    uid: string;
    count: number;
}

export class AntiRecordBot {
    private _warnList: IWarnList[] = [];
    constructor(bot: Bot) {
        console.log('[AntiRecordBot] Support group handle added');
        setInterval(this.checkForRecording, 1000, this, bot.teamSpeakHandle);
    }

    private async checkForRecording(handle: AntiRecordBot, tsHandle: TeamSpeak): Promise<void> {
        const clientList = await tsHandle.clientList();
        if (!clientList) return;
        for (const client of clientList) {
            if (!client.isRecording) continue;

            const warnedUser = handle._warnList.findIndex((user) => user.uid == client.uniqueIdentifier);
            if (warnedUser == -1) {
                handle._warnList.push({ count: 1, uid: client.uniqueIdentifier });
                handle.kickRecordingUser(client);
            } else {
                if (handle._warnList[warnedUser].count < 3) {
                    handle.kickRecordingUser(client);
                    handle._warnList[warnedUser].count++;
                } else {
                    handle.banRecordingUser(client, handle._warnList[warnedUser].count * 10000);
                    handle._warnList[warnedUser].count++;
                }
            }
        }
    }
    /**
     * Bans a user for the given time
     * @param  {TeamSpeakClient} client Handle to client
     * @param  {number} banTime Time to ban in ms
     */
    private banRecordingUser(client: TeamSpeakClient, banTime: number) {
        console.log(
            `[AntiRecordBot] ${client.nickname} is recording, for the ${banTime / 10000}th time, now banning him for ${
                banTime / 1000
            } minutes`,
        );
        client.ban('Wiederholtes aufnehmen trotz mehrmaliger Ermahnung', banTime);
        this.kickRecordingUser(client);
    }
    /**
     * Kicks a user from the server
     * @param  {TeamSpeakClient} client Handle to client
     */
    private kickRecordingUser(client: TeamSpeakClient) {
        console.log(`[AntiRecordBot] ${client.nickname} is recording, kicking from server`);
        client.kickFromServer('Das Aufnehmen auf diesem Server ist verboten!');
    }
}
