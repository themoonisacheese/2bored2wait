const { SlashCommandBuilder } = require('discord.js');
const { options } = require('request');
const PubSub = require('pubsub-js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send a message to the minecraft server you are connected to!')
        .addStringOption(option => option.setName('message').setDescription('send message bitch').setRequired(true)),
    async execute(interaction) {
        await interaction.reply("Sent Message!").then(() => {
            console.log("Actually did the thing (send)");
            PubSub.publish('sendMcMsg', interaction.options.getString('message'))
        });
    },
};
