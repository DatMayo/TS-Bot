import { TeamSpeak } from 'ts3-nodejs-library';
import { TeamSpeakChannel } from 'ts3-nodejs-library/lib/node/Channel';
import { ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { Bot } from '..';

interface IChannelDefinition {
    pattern: string;
    upperChannel: string;
}
export class ChannelBot {
    private _managedChannels: IChannelDefinition[] = [
        { pattern: 'Team #', upperChannel: 'Team-Talk' },
        { pattern: 'Support #', upperChannel: 'Support' },
    ];
    private _teamSpeakHandle: TeamSpeak | undefined;
    constructor(bot: Bot) {
        console.log('[ChannelBot] Staging started, please wait');
        this._teamSpeakHandle = bot.teamSpeakHandle;
        bot.onClientMoved(this.refreshChannels.bind(this));
        bot.onClientConnect(this.refreshChannels.bind(this));
        bot.onClientDisconnect(this.refreshChannels.bind(this));
        this.refreshChannels().then(() => console.log('[ChannelBot] Staging complete, ChannelBot ready'));
    }

    private async refreshChannels() {
        if (!this._teamSpeakHandle) return;
        const channelList: TeamSpeakChannel[] | undefined = await this._teamSpeakHandle.channelList();
        for (const manangedChannel of this._managedChannels) {
            const channelToRenameHandles: TeamSpeakChannel[] = [];
            const channelHandles = channelList.filter((channel) => channel.name.startsWith(manangedChannel.pattern));
            if (!channelHandles) continue;
            for (let i = 0; i < channelHandles.length; i++) {
                (await channelHandles[i].getClients()).length === 0 && i < channelHandles.length - 1
                    ? await channelHandles[i].del()
                    : channelToRenameHandles.push(channelHandles[i]);
            }
            for (let i = 0; i < channelToRenameHandles.length; i++) {
                const channelName = `${manangedChannel.pattern}${i + 1}`;
                if (channelToRenameHandles[i].name !== channelName) {
                    await this._teamSpeakHandle.channelEdit(channelToRenameHandles[i], { channelName });
                }
            }
            const lastChannel = channelToRenameHandles[channelToRenameHandles.length - 1];
            if ((await lastChannel.getClients()).length > 0) {
                const upperChannel = await this._teamSpeakHandle.getChannelByName(manangedChannel.upperChannel);
                if (!upperChannel) continue;
                await this._teamSpeakHandle.channelCreate(
                    `${manangedChannel.pattern}${channelToRenameHandles.length + 1}`,
                    {
                        channelFlagPermanent: true,
                        cpid: upperChannel.cid,
                    },
                );
            }
        }
    }

    async clientMoved(event: ClientMoved): Promise<void> {
        if (this._managedChannels.find((item) => event.channel.name.startsWith(item.pattern))) {
            await this.refreshChannels();
        }
    }
}
