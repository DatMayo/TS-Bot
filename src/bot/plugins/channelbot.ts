import { TeamSpeak } from 'ts3-nodejs-library';
import { TeamSpeakChannel } from 'ts3-nodejs-library/lib/node/Channel';
import { ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from '..';

interface IChannelDefinition {
    pattern: string;
    upperChannel: string;
}
export class ChannelBot {
    private _managedChannel: IChannelDefinition[] = [
        { pattern: 'Team #', upperChannel: 'Team-Talk' },
        { pattern: 'Support #', upperChannel: 'Support' },
    ];
    private _managedChannelHandle: TeamSpeakChannel[] = [];
    private _teamSpeakHandle: TeamSpeak | undefined;
    constructor(bot: Bot) {
        console.log('[ChannelBot] Staging started, please wait');
        this.init(bot).then(() => console.log('[ChannelBot] Staging complete, ChannelBot ready'));
    }

    private async init(bot: Bot) {
        this._teamSpeakHandle = await (await bot.getDefaultChannel()).getParent();
        for (const currentManangedChannel of this._managedChannel) {
            const channelList: TeamSpeakChannel[] | undefined = await this._teamSpeakHandle.channelList();
            const channelHandle = channelList.filter((channel) =>
                channel.name.startsWith(currentManangedChannel.pattern),
            );

            if (!channelHandle) return;
            for (const channel of channelHandle) this._managedChannelHandle.push(channel);
        }

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

                    // ToDo, delete ^ channel on this._managedChannelHandle
                }
                previusLoopChannel = currentChannel;
            }
        }
        bot.onClientMoved(this.clientMoved.bind(this));
    }

    async clientMoved(event: ClientMoved): Promise<void> {
        const channel = event.channel;

        if (!this._teamSpeakHandle) return;

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
        const newChannel = await this._teamSpeakHandle.channelCreate(
            `${filteredChannel.pattern}${filteredChannelHandle.length + 1}`,
            {
                channelFlagPermanent: true,
                cpid: upperChannel.cid,
            },
        );

        this._managedChannelHandle.push(newChannel);

        return;
    }
}
