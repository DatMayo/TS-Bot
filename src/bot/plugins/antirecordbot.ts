import { TeamSpeakClient } from 'ts3-nodejs-library';
import { Bot } from '../bot';
import { sleep } from '../utils';
interface IWarnList {
    uid: string;
    count: number;
}

/**
 * AntiRecordBot plugin for TS Bot.
 * @param {Bot} bot Handle to the main bot
 */
export class AntiRecordBot {
    private _warnList: IWarnList[] = [];
    /**
     * Constructor of AntiRecordBot invoces initialization.
     * @param {Bot} bot Handle to the main bot
     */
    constructor(bot: Bot) {
        this.init(bot);
    }
    /**
     * Initializes AntiRecordBot and starts checking loop.
     * @param {Bot} bot Handle to the main bot
     */
    private async init(bot: Bot): Promise<void> {
        console.log('[AntiRecordBot] Initialization started');
        console.log('[AntiRecordBot] Initialization done');
        //eslint-disable-next-line no-constant-condition
        while (true) {
            await this.checkForRecording(bot);
            await sleep(1000);
        }
    }
    /**
     * Checking for recording users.
     * @param {Bot} bot Handle to the main bot
     */
    private async checkForRecording(bot: Bot): Promise<void> {
        const clientList = await bot.teamSpeakHandle.clientList();
        if (!clientList) return;
        for (const client of clientList) {
            if (!client.isRecording) continue;
            const warnedUser = this._warnList.findIndex((user) => user.uid == client.uniqueIdentifier);
            if (warnedUser == -1) {
                this._warnList.push({ count: 0, uid: client.uniqueIdentifier });
            }
            this._warnList[warnedUser].count++;
            this._warnList[warnedUser].count < 3
                ? this.kickRecordingUser(client)
                : this.banRecordingUser(client, this._warnList[warnedUser].count);
        }
    }
    /**
     * Bans a user for the given time
     * @param {TeamSpeakClient} client Handle to client
     * @param {number} banTime Time to ban in ms
     */
    private banRecordingUser(client: TeamSpeakClient, count: number) {
        console.log(
            `[AntiRecordBot] ${client.nickname} is recording, for the ${count}th time, now banning him for ${count} minutes`,
        );
        client.ban('Wiederholtes aufnehmen trotz mehrmaliger Ermahnung', count * 600);
        this.kickRecordingUser(client);
    }
    /**
     * Kicks a user from the server
     * @param {TeamSpeakClient} client Handle to client
     */
    private kickRecordingUser(client: TeamSpeakClient) {
        console.log(`[AntiRecordBot] ${client.nickname} is recording, kicking from server`);
        client.kickFromServer('Das Aufnehmen auf diesem Server ist verboten!');
    }
}
