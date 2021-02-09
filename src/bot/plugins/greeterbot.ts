import { ClientConnect, ClientDisconnect } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from '..';

/**
 * GreeterBot plugin for TS Bot.
 * @param {Bot} bot Handle to the main bot
 */
export class GreeterBot {
    /**
     * Constructor of GreeterBot invoces initialization.
     * @param {Bot} bot Handle to the main bot
     */
    constructor(bot: Bot) {
        this.init(bot);
    }
    /**
     * Initializes GreeterBot and sets groups and events.
     * @param {Bot} bot Handle to the main bot
     */
    private async init(bot: Bot) {
        console.log('[GreeterBot] Initialization started');
        bot.teamSpeakHandle.on('clientconnect', this.clientConnect.bind(this));
        bot.teamSpeakHandle.on('clientdisconnect', this.clientDisconnect.bind(this));
        console.log('[GreeterBot] Initialization done');
    }
    /**
     * Function which will be invoked by onClientConnect event
     * @param  {ClientConnect} event ClientConnect event
     */
    private async clientConnect(event: ClientConnect): Promise<void> {
        const client = event.client;
        if (client.type != 0) return; // Ignore server query clients
        console.log(`[GreeterBot] User ${client.nickname} connected`);
        client.message(
            'Willkommen auf unserem Server. Bitte registriere dich auf unserer Homepage (https://reloaded-life.de/#/register), falls du dies noch nicht getan hast.',
        );
    }
    /**
     * Function which will be invoked by onClientDisconnect event
     * @param {ClientDisconnect} event ClientDisconnect event
     */
    private clientDisconnect(event: ClientDisconnect): void {
        const client = event.client;
        if (!client || client.type != 0) return;
        console.log(`[GreeterBot] User ${client.nickname} disconnected`);
    }
}
