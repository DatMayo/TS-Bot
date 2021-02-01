import { TeamSpeak } from 'ts3-nodejs-library';
import { ClientConnect } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from './bot';

export class GreeterBot extends Bot {
    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        super(teamSpeakHandle, serverName);
        console.log('[GreeterBot] GreeterBot started');
    }

    clientConnect(event: ClientConnect): void {
        const client = event.client;

        // Server Query Clients
        if (client.servergroups[0] == '2') return;

        if (this._guestGroupHandle) {
            if (client.servergroups.indexOf(this._guestGroupHandle.sgid) >= 0) {
                console.log(`[GreeterBot] New user ${client.nickname} connected`);
                return client.message(
                    'Willkommen auf unserem Server, bitte registriere dich auf unserer Homepage https://reloaded-life.de/#/register um weitere Funktionen auf diesem TS freizuschalten',
                );
            } else {
                console.log(`[GreeterBot] Recurring user ${client.nickname} connected`);
                client.message(
                    `Willkommen zurück, dein letzter Besuch bei uns war am ${this.timeConverter(client.lastconnected)}`,
                );
            }
        }
    }
}
