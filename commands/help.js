const Discord = require('discord.js');
const settings = require('../config/settings.json');

module.exports = {
	name: 'help',
	description: 'Display available commands with descriptions',
	usage: ['', '<command name>'],
	examples: ['play', 'skipto'],
	async run(client, message, args) {

		// Initialize commands array
		const commands = message.client.commands.array();

		if (!args.length) {

			// Initialize embed display
			const helpEmbed = new Discord.MessageEmbed()
				.setTitle('Bad Wolf Bot Help')
				.setDescription(`For help with a specific command, type \`${settings.prefix}help <command name>\``)
				.setFooter('more can be programmed on request')
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
		}

		const name = args[0].toLowerCase();
		const command = client.commands.get(name) || client.commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			return message.reply('that\'s not a valid command!');
		}

		const data = [];
		data.push(`**Name:** ${command.name}`);

		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) command.usage.forEach(paradigm);
		function paradigm(usage) {
			data.push(`**Usage:** \`${settings.prefix}${command.name} ${usage}\``);
		}

		if (command.examples) command.examples.forEach(exemplar);
		function exemplar(example) {
			data.push(`**Example:** \`${settings.prefix}${command.name} ${example}\``);
		}

		return message.channel.send(data, { split: true });


	},
};
