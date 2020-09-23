const settings = require('../config/settings.json');
const fs = require ('fs');


module.exports = {
	name: 'pruning',
	description: 'Toggle removal of users commands or set how long they stay before being deleted',
	async run(client, message, args) {

		// If no args, just toggle pruning
		if (!args[0]) {
			settings.userPruning = !settings.userPruning;
			message.channel.send(`Pruning is now ${settings.userPruning ? '**on**' : '**off**'}`).catch(console.error);

		}
		// If args are bettween 1-60, change the cooldown timer
		else if (parseInt(args[0]) > 0 && parseInt(args[0]) <= 60) {
			if (!settings.userPruning) {
				settings.userPruning = true;
				message.channel.send('Pruning is now **on**').catch(console.error);
			}
			settings.cooldown = parseInt(args[0]);
			message.channel.send(`Pruning time is now set to \`${settings.cooldown}\` seconds`).catch(console.error);

		}
		// If args are garbage, send usage notes
		else {
			return message.channel.send(`**Usage:** \`${settings.prefix}${module.exports.name} <null>\` to toggle message pruning\n
			**or**\n
			 \`${settings.prefix}${module.exports.name} <1-60 seconds>\` to change time before message is deleted.`).catch(console.error);
		}

		// Write the new settings to file
		fs.writeFile('./config/settings.json', JSON.stringify(settings), 'utf8', function(err) {
			if (err) {
				console.log('An error occured while writing pruning to File.');
				return console.log(err);
			}
			return console.log('Pruning settings have been updated to the settings file');
		});
	},
};