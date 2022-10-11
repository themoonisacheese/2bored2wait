const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const { clientId, guildId, BotToken } = require('./config/local.json');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(BotToken);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(data => console.log(`Successfully registered ${data.length} application commands.`))
    .catch(console.error);