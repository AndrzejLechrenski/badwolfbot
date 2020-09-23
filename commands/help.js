const Discord = require('discord.js');
const settings = require('../config/settings.json');

module.exports = {
	name: 'help',
	description: 'Display all commands and descriptions',
	async run(client, message, args) {

		// Initialize commands array
		const commands = message.client.commands.array();

		// Initialize embed display
		const helpEmbed = new Discord.MessageEmbed()
			.setTitle('Bad Wolf Bot Help')
			.setDescription('These are the currently available commands:')
			.setFooter('more on request')
			.setColor('ORANGE');

		commands.forEach((cmd) => {
			helpEmbed.addField(
				`\`${settings.prefix}${cmd.name}\``,
				`${cmd.description}`,
				true,
			);
		});

		// Send embed
		message.channel.send(helpEmbed).catch(console.error);

		// Send our honorable motto
		return message.channel.send(`${settings.motto}`);

	},
};
