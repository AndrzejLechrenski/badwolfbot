const settings = require('../config/settings.json');
const fs = require('fs');

module.exports = {
	name: 'volume',
	description: 'Change the volume',
	async run(client, message, args) {

		// Return the current volume if no Args are given
		if (!args[0]) return message.channel.send(`Current volume is \`${settings.volume}\``);

		// Security modification
		if (args[0] != '+' && args[0] != '-' && isNaN(args[0])) return message.channel.send('Please enter a valid integer or `+` or `-`');
		if (args[0] > 100) return message.channel.send('Volume must be less than 100');
		if (args[0] < 0) return message.channel.send('Volume must be greater than zero');
		if (message.content.includes(',')) return message.channel.send('Please enter a valid integer');
		if (message.content.includes('.')) return message.channel.send('Please enter a valid integer');

		// Set volume
		const oldVolume = settings.volume;
		if (args[0] == '+') {
			let volume = (settings.volume += 5);
			if (volume > 100) {
				volume = 100;
				settings.volume = 100;
			}
			client.player.setVolume(message.guild.id, volume);
			message.channel.send(`Volume changed from \`${oldVolume}\` to \`${volume}\``);
		}

		if (args[0] == '-') {
			let volume = (settings.volume -= 5);
			if (volume < 0) {
				volume = 0;
				settings.volume = 0;
			}
			client.player.setVolume(message.guild.id, volume);
			message.channel.send(`Volume changed from \`${oldVolume}\` to \`${volume}\``);
		}

		if (!isNaN(args[0])) {
			settings.volume = parseInt(args.join(' '));
			client.player.setVolume(message.guild.id, parseInt(args[0]));
			message.channel.send(`Volume changed from \`${oldVolume}\` to \`${parseInt(args[0])}\``);
		}

		// Write the new volume to the settings file
		fs.writeFile('./config/settings.json', JSON.stringify(settings), 'utf8', function(err) {
			if (err) {
				console.log('An error occured while writing volume to File.');
				return console.log(err);
			}
			console.log('Volume has been updated to the settings file');
		});
	},
};