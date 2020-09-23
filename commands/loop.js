module.exports = {
	name: 'loop',
	description: 'Repeats the current track until "loop" is issued again',
	async run(client, message) {

		// If there's no music
		if(!client.player.isPlaying(message.guild.id)) return message.channel.send('Nothing is playing');

		// Repeat mode
		const repeatMode = client.player.getQueue(message.guild.id).repeatMode;

		// If the mode is enabled
		if(repeatMode) {

			client.player.setRepeatMode(message.guild.id, false);

			// Message
			return message.channel.send('Repeat mode disabled');

		// If the mode is disabled
		}
		else {

			client.player.setRepeatMode(message.guild.id, true);

			// Message
			return message.channel.send('Repeat mode enabled');

		}

	},
};