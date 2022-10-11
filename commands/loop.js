const { SlashCommandBuilder } = require('discord.js');
const { options } = require('request');
const PubSub = require('pubsub-js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Allows you to change the looping settings or get the current status!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Prints the status of the loop setting.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enables looping.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disables looping.'))
    ,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true })
        PubSub.publish('mcLoop', interaction)
    },
};