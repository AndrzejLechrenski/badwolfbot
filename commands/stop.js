module.exports = {
	name: 'stop',
	description: 'Completely stops the bot. Also clears the queue',
	async run(client, message) {

		// If there's no music
		if(!client.player.isPlaying(message.guild.id)) return message.channel.send('Nothing to stop.');

		// Stop player
		client.player.stop(message.guild.id);

		// Message
		message.channel.send('Music stopped. Queue cleared.');
	},
};
