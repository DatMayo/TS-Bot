import { TeamSpeak } from 'ts3-nodejs-library';
import { ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from './bot';

export class TeamBot extends Bot {
    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        super(teamSpeakHandle, serverName);
    }

    clientMoved(event: ClientMoved): Promise<[]> | undefined {
        const client = event.client;
        const channel = event.channel;

        // Keine nicht Team Member in Team Channel!
        if (this._teamGroupHandle && this._tsDefaultChannel) {
            const isTeamMember = client.servergroups.indexOf(this._teamGroupHandle.sgid) >= 0;
            if (channel.name.includes('Team') && !isTeamMember) return client.move(this._tsDefaultChannel.cid);
        }
        return;
    }
}
