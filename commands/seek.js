const settings = require('../config/settings.json');

module.exports = {
	name: 'seek',
	description: 'Seeks to a specified time or ff a number or seconds',
	usage: ['seek 1:30', 'seek 30'],

	async run(client, message, args) {

		// If no arguments
		if (!args.length) return message.channel.send(`**Usage:** \`${settings.prefix}${module.exports.name} <Seek time. E.g. 1:30 or 0:30>\``).catch(console.error);

		// A track must be playing
		const alreadyPlaying = client.player.isPlaying(message.guild.id);
		if(!alreadyPlaying) return message.channel.send('Nothing is playing!');

		// Load queue and a function for later
		const queue = client.player.getQueue(message.guild.id);
		const totalTime = Math.floor(queue.playing.durationMS / 1000);
		function parse() {
			const split = args[0].split(':');
			if (split.length === 3) return parseInt(split[0]) * 3600 + parseInt(split[1]) * 60 + parseInt(split[2]);
			else return parseInt(split[0]) * 60 + parseInt(split[1]);
		}

		// Quick and dirty FF and RWD
		if (!isNaN(args[0])) {
			const seekTime = (queue.voiceConnection.dispatcher.streamTime + queue.additionalStreamTime) / 1000 + parseInt(args[0]);
			// Cannot seek beyond the end of the track
			if (seekTime > totalTime) return message.channel.send('Cannot seek past the end of the current track!');
			if (seekTime < 0) return message.channel.send('Cannot seek earlier than the start of the track!');
			// Action
			const result = client.player._playYTDLStream(queue, seekTime);
			// Message
			if(!result) return message.channel.send('Seek failed!');
			message.channel.send(`Seeking ${args[0]} seconds`).catch(console.error);
		}
		else {
			const seekTime = parse(args[0]);
			// If M:SS was not provided
			if (isNaN(seekTime)) return message.channel.send('You must provide the seeek time in M:SS or H:MM:SS format').catch(console.error);
			// Cannot seek beyond the end of the track
			if (seekTime > totalTime) return message.channel.send('Cannot seek past the end of the current track!');
			// Action
			const result = client.player._playYTDLStream(queue, seekTime);
			// Message
			if(!result) return message.channel.send('Seek failed!');
			message.channel.send(`Seeking to ${args[0]}`).catch(console.error);
		}
	},
};
