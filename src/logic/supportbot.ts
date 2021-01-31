import { TSExitCode } from '../enums';
import { TeamSpeak, TeamSpeakServerGroup } from 'ts3-nodejs-library';
import { TextMessage } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from './bot';

export class SupportBot extends Bot {
    private _supportGroupName: string = process.env.TS_SUPPORT_GROUP || 'Bereitschaft';
    private _supportGroupHandle: TeamSpeakServerGroup | undefined;
    // private _availableSupporter: TeamSpeakClient[] = [];
    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        super(teamSpeakHandle, serverName);
    }

    async textMessage(event: TextMessage): Promise<void | undefined> {
        if (!this._supportGroupHandle) {
            this._supportGroupHandle = await this._teamSpeakHandle.getServerGroupByName(this._supportGroupName);
            if (!this._supportGroupHandle) return process.exit(TSExitCode.SupportGroupNotFound);
        }
        const client = event.invoker;

        if (!this._teamGroupHandle) return;

        const isTeamMember = client.servergroups.indexOf(this._teamGroupHandle.sgid) >= 0;
        if (!isTeamMember) return;

        switch (event.msg) {
            case '!on':
                break;

            case '!off':
                break;

            default:
                event.invoker.message('Diesen Befehl kenne ich nicht');
                break;
        }
    }
}
