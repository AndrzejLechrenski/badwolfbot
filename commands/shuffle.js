module.exports = {
	name: 'shuffle',
	description: 'Randomizes the order of tracks in the queue',
	async run(client, message) {

		// If there's no music
		if(!client.player.isPlaying(message.guild.id)) return message.channel.send('Nothing is playing');

		// Shuffle queue
		client.player.shuffle(message.guild.id);

		// Message
		return message.channel.send('Queue shuffled');
	},
};
