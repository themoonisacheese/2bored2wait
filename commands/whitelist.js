const { SlashCommandBuilder } = require('discord.js');
const { options } = require('request');
const PubSub = require('pubsub-js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Manage the whitelist of the proxy!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add user to whitelist')
                .addStringOption(option => option.setName('username').setDescription('Username of account you want to add').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove user from whitelist')
                .addStringOption(option => option.setName('username').setDescription('Username of account you want to add').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List users on the whitelist'))
    ,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true })
        PubSub.publish('whitelist', interaction)
    },
};
