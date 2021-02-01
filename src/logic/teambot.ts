import { TeamSpeak } from 'ts3-nodejs-library';
import { ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from './bot';

export class TeamBot extends Bot {
    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        super(teamSpeakHandle, serverName);
        console.log('[TeamBot] TeamBot started');
    }

    clientMoved(event: ClientMoved): void {
        const client = event.client;
        const channel = event.channel;

        // Keine nicht Team Member in Team Channel!
        if (!this._teamGroupHandle) return;
        if (!this._tsDefaultChannel) return;

        if (channel.name.includes('Team') && !this.isTeamMember(event.client)) {
            console.log(`[TeamBot] ${client.nickname} joined a team channel, but he isn't a team member`);
            this.moveToDefaultChannel(client);
        }
    }
}
