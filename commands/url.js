const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('url')
        .setDescription('Shows link to the Github Repo!'),
    async execute(interaction) {
        await interaction.reply({ content: "https://github.com/themoonisacheese/2bored2wait", ephemeral: true }).then(() => {
            console.log("Actually did the thing (url)");
        });
    },
};
