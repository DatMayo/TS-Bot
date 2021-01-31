import { TeamSpeak } from 'ts3-nodejs-library';
import { ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from './bot';

export class TeamBot extends Bot {
    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        super(teamSpeakHandle, serverName);
    }

    clientMoved(event: ClientMoved): void {
        const client = event.client;
        const channel = event.channel;

        // Keine nicht Team Member in Team Channel!
        if (this._teamGroupHandle && this._tsDefaultChannel) {
            if (channel.name.includes('Team') && !this.isTeamMember(event.client)) this.moveToDefaultChannel(client);
        }
    }
}
