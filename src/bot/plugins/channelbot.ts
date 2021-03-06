import { TeamSpeak } from 'ts3-nodejs-library';
import { TeamSpeakChannel } from 'ts3-nodejs-library/lib/node/Channel';
import { Bot } from '..';

interface IChannelDefinition {
    pattern: string;
    upperChannel: string;
}
/**
 * ChannelBot plugin for TS Bot.
 * @param {Bot} bot Handle to the main bot
 */
export class ChannelBot {
    private _managedChannels: IChannelDefinition[] = [
        { pattern: 'Team #', upperChannel: 'Team-Talk' },
        { pattern: 'Support #', upperChannel: 'Support' },
    ];
    private _teamSpeakHandle: TeamSpeak | undefined;
    /**
     * Constructor of ChannelBot invoces initialization.
     * @param {Bot} bot Handle to the main bot
     */
    constructor(bot: Bot) {
        this.init(bot);
    }
    /**
     * Initializes ChannelBot and sets events.
     * @param {Bot} bot Handle to the main bot
     */
    private async init(bot: Bot) {
        console.log('[ChannelBot] Initialization started');
        this._teamSpeakHandle = bot.teamSpeakHandle;
        bot.teamSpeakHandle.on('clientmoved', this.refreshChannels.bind(this));
        bot.teamSpeakHandle.on('clientconnect', this.refreshChannels.bind(this));
        bot.teamSpeakHandle.on('clientdisconnect', this.refreshChannels.bind(this));
        await this.refreshChannels();
        console.log('[ChannelBot] Initialization done');
    }
    /**
     * Function which will be invoked by onClientMoved, onClientConnect and onClientDisconnect event.
     */
    private async refreshChannels() {
        if (!this._teamSpeakHandle) return;
        const channelList: TeamSpeakChannel[] | undefined = await this._teamSpeakHandle.channelList();
        try {
            for (const manangedChannel of this._managedChannels) {
                const channelToRenameHandles: TeamSpeakChannel[] = [];
                const channelHandles = channelList.filter((channel) =>
                    channel.name.startsWith(manangedChannel.pattern),
                );
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
                    const channel = await this._teamSpeakHandle.channelCreate(
                        `${manangedChannel.pattern}${channelToRenameHandles.length + 1}`,
                        {
                            channelFlagPermanent: true,
                            cpid: upperChannel.cid,
                        },
                    );
                    const channelPower: number = parseInt(<string>process.env.TS_NEEDED_CHANNEL_POWER) || 50;
                    const filePower: number = parseInt(<string>process.env.TS_NEEDED_FILE_POWER) || 100;
                    await this._teamSpeakHandle.channelSetPerms(channel, [
                        {
                            permsid: 'i_channel_needed_subscribe_power',
                            permvalue: channelPower,
                        },
                        {
                            permsid: 'i_channel_needed_join_power',
                            permvalue: channelPower,
                        },
                        {
                            permsid: 'i_needed_modify_power_channel_modify_power',
                            permvalue: channelPower,
                        },
                        {
                            permsid: 'i_channel_needed_modify_power',
                            permvalue: channelPower,
                        },
                        // File Transfer, set to higest posibile
                        {
                            permsid: 'i_ft_needed_file_upload_power',
                            permvalue: filePower,
                        },
                        {
                            permsid: 'i_ft_needed_file_download_power',
                            permvalue: filePower,
                        },
                        {
                            permsid: 'i_ft_needed_file_delete_power',
                            permvalue: filePower,
                        },
                        {
                            permsid: 'i_ft_needed_file_rename_power',
                            permvalue: filePower,
                        },
                        {
                            permsid: 'i_ft_needed_file_browse_power',
                            permvalue: filePower,
                        },
                        {
                            permsid: 'i_ft_needed_directory_create_power',
                            permvalue: filePower,
                        },
                    ]);
                }
            }
        } catch (ex) {
            console.log(`[ChannelBot] Could not modify/delete channel. Error was: ${ex.message}`);
        }
    }
}
