// Required to access the filesystem
const fs = require('fs');
// Required to access Discord
const Discord = require('discord.js');
// The music player backend, built on a modified version of 'discord-player' by 'Androz2091'
const Player = require('./backend/Player.js');

// Load the Discord token
require('dotenv').config();
// const security = require('./config/security.json');

// Initialize a Discord client for the bot
const client = new Discord.Client({ token: process.env.DISCORD_TOKEN });

// Rename the backend (module exports as 'Player') for easier use. Associate it with the bot.
const player = new Player(client);
client.player = player;

// On any client event the corresponding file will be read. E.g. 'client.on('ready')' reads 'ready.js' and executes that code
fs.readdir('./events/', (err, files) => {
	if (err) return console.error(err);
	files.forEach(file => {
		const event = require(`./events/${file}`);
		const eventName = file.split('.')[0];
		console.log(`Loading event ${eventName}`);
		client.on(eventName, event.bind(null, client));
	});
});

// Create a Discord.js "collections" Enmap for the commands
client.commands = new Discord.Collection();

// Load the commmand files. The file name becomes the name of the command.
fs.readdir('./commands/', (err, files) => {
	if (err) return console.error(err);
	files.forEach(file => {
		if (!file.endsWith('.js')) return;
		const action = require(`./commands/${file}`);
		const commandName = file.split('.')[0];
		console.log(`Loading command ${commandName}`);
		client.commands.set(commandName, action);
	});
});

// To catch unhandled promise rejections (because their console errors are deprecated in Node.js):
process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));

// Bot should log in
client.login(client.token);