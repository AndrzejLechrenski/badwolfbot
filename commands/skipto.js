const settings = require('../config/settings.json');

module.exports = {
	name: 'skipto',
	description: 'Skip to a track number in queue',
	async run(client, message, args) {

		// If no arguments
		if (!args.length) return message.channel.send(`**Usage:** \`${settings.prefix}${module.exports.name} <Queue Number>\``).catch(console.error);

		// If no track number given
		if (isNaN(args[0])) return message.channel.send(`**Usage:** \`${settings.prefix}${module.exports.name} <Queue Number>\``).catch(console.error);

		// If the queue is empty
		const queue = client.player.getQueue(message.guild.id);
		if (!queue) return message.channel.send('Queue is empty').catch(console.error);

		// If the command requested skipping beyond the number of tracks in the queue
		if (args[0] > queue.tracks.length) return message.channel.send(`The queue is only ${queue.tracks.length} tracks long!`).catch(console.error);

		// Action
		// Check for loop command
		if (queue.loop) {
			for (let i = 0; i < args[0] - 2; i++) {
				queue.tracks.push(queue.tracks.shift());
			}
		}

		// Normal execution
		else {
			queue.tracks = queue.tracks.slice(args[0] - 2);
			client.player.skip(message.guild.id);
		}

		// Message
		message.channel.send(`${message.author} skipped ${args[0] - 1} tracks`).catch(console.error);
	},
};