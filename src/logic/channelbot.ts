import { TeamSpeak, TeamSpeakChannel } from 'ts3-nodejs-library';
import { ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from '.';

interface IChannelDefinition {
    pattern: string;
    upperChannel: string;
}

export class ChannelBot extends Bot {
    private _stageCheck: NodeJS.Timeout;
    private _managedChannel: IChannelDefinition[] = [
        { pattern: 'Team #', upperChannel: 'Team-Talk' },
        { pattern: 'Support #', upperChannel: 'Support' },
    ];
    private _managedChannelHandle: TeamSpeakChannel[] = [];
    private _currentStage = 0;

    constructor(teamSpeakHandle: TeamSpeak, serverName: string) {
        super(teamSpeakHandle, serverName);
        console.log('[ChannelBot] Staging started, please wait');
        this._stageCheck = setInterval(this.startStagingProcess.bind(this), 5000);
    }

    private async startStagingProcess(): Promise<void> {
        // Load all managed channels
        try {
            if (this._currentStage == 0) {
                this._managedChannelHandle = [];
                for (const currentManangedChannel of this._managedChannel) {
                    const channelList: TeamSpeakChannel[] | undefined = await this._teamSpeakHandle.channelList();
                    const channelHandle = channelList.filter((channel) =>
                        channel.name.startsWith(currentManangedChannel.pattern),
                    );

                    if (!channelHandle) return;
                    for (const channel of channelHandle) {
                        const idx = this._managedChannelHandle.indexOf(channel);
                        if (idx === -1) this._managedChannelHandle.push(channel);
                    }
                }
                this._currentStage = 1;
                console.log(`[ChannelBot] Loaded ${this._managedChannelHandle.length} managed channels`);
            }
        } catch (err) {
            if (err.message == 'invalid serverID') return;
            else console.log(err);
        }

        // Check if there are unused channels
        try {
            if (this._currentStage == 1) {
                for (const autoChannelName of this._managedChannel) {
                    const channel = this._managedChannelHandle
                        .filter((channel) => channel.name.startsWith(autoChannelName.pattern))
                        .reverse();
                    let previusLoopChannel: TeamSpeakChannel | undefined = undefined;
                    for (const currentChannel of channel) {
                        const clientCount = await currentChannel.getClients();

                        if (clientCount.length > 0) continue;

                        if (previusLoopChannel) {
                            console.log(`[ChannelBot] Found unused ${previusLoopChannel.name} channel, deleting`);
                            previusLoopChannel.del();
                        }
                        previusLoopChannel = currentChannel;
                    }
                }
                this._currentStage = 2;
            }
        } catch (err) {
            if (err.message == 'invalid serverID') return;
            else console.log(err);
        }

        if (this._currentStage == 2) {
            console.log('[ChannelBot] Staging complete, ChannelBot ready');

            clearInterval(this._stageCheck);
        }
    }

    async clientMoved(event: ClientMoved): Promise<void> {
        const channel = event.channel;

        const filteredChannel = this._managedChannel.find((item) => channel.name.startsWith(item.pattern));
        if (!filteredChannel) return;

        const filteredChannelHandle = this._managedChannelHandle.filter((item) =>
            item.name.startsWith(filteredChannel.pattern),
        );
        let createNewChannel = true;
        const channelList = await this._teamSpeakHandle.channelList();
        const upperChannel = channelList.find((item) => item.name == filteredChannel.upperChannel);
        if (!upperChannel) return;

        for (const currentChannel of filteredChannelHandle) {
            const clientCount = await currentChannel.getClients();
            if (clientCount.length === 0) createNewChannel = false;
        }

        if (!createNewChannel) return;

        await this._teamSpeakHandle.channelCreate(`${filteredChannel.pattern}${filteredChannelHandle.length + 1}`, {
            channelFlagPermanent: true,
            cpid: upperChannel.cid,
        });

        return;
    }
}
