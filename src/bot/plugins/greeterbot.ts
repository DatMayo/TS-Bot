import { TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { ClientConnect, ClientDisconnect } from 'ts3-nodejs-library/lib/types/Events';
import { timeConverter } from '../utils';
import { Bot } from '..';

/**
 * GreeterBot plugin for TS Bot.
 * @param {Bot} bot Handle to the main bot
 */
export class GreeterBot {
    private _tsGuestGroup: TeamSpeakServerGroup | undefined = undefined;
    /**
     * Constructor of GreeterBot invoces initialization.
     * @param  {Bot} bot Handle to the main bot
     */
    constructor(bot: Bot) {
        this.init(bot);
    }
    /**
     * Initializes GreeterBot and sets groups and events.
     * @param  {Bot} bot Handle to the main bot
     */
    private async init(bot: Bot) {
        this._tsGuestGroup = await bot.getGroupByName(process.env.TS_GUEST_GROUP || 'Guest');
        bot.onClientConnect(this.clientConnect.bind(this));
        bot.onClientDisconnect(this.clientDisconnect.bind(this));
        console.log('[GreeterBot] GreeterBot started');
    }
    /**
     * Function which will be invoked by onClientConnect event
     * @param  {ClientConnect} event ClientConnect event
     */
    private async clientConnect(event: ClientConnect): Promise<void> {
        const client = event.client;
        if (client.type != 0) return; // Ignore server query clients
        if (this._tsGuestGroup) {
            if (client.servergroups.indexOf(this._tsGuestGroup.sgid) >= 0) {
                console.log(`[GreeterBot] New user ${client.nickname} connected`);
                return client.message(
                    'Willkommen auf unserem Server, bitte registriere dich auf unserer Homepage https://reloaded-life.de/#/register um weitere Funktionen auf diesem TS freizuschalten',
                );
            } else {
                console.log(`[GreeterBot] Recurring user ${client.nickname} connected`);
                client.message(
                    `Willkommen zurück, dein letzter Besuch bei uns war am ${timeConverter(client.lastconnected)}`,
                );
            }
        }
    }
    /**
     * Function which will be invoked by onClientDisconnect event
     * @param  {ClientDisconnect} event ClientDisconnect event
     */
    private clientDisconnect(event: ClientDisconnect): void {
        const client = event.client;
        if (!client || client.type != 0) return;
        console.log(`[GreeterBot] User ${client.nickname} disconnected`);
    }
}
