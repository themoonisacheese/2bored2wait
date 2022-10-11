const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all possible commands!'),
    async execute(interaction) {
        await interaction.reply({ content: " help: Lists available commands.\n start 14:00: Start queue at 2pm.\n play 8:00: Tries to calculate the right time to join so you can play at 8:00am.\n start: Starts the queue.\n loop: Restarts the queue if you are not connect at the end of it,\n loop status: Lets you know if you have reconnect on or off.\n update: Sends an update to the current channel with your position and ETA.\n url: displays the github url.\n stop: Stops the queue.\n exit or quit: Exits the application.\n stats: Displays your health and hunger.", ephemeral: true }).then(() => {
            console.log("Actually did the thing (Help)");
        });
    },
};
