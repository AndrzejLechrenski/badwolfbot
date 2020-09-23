module.exports = {
	name: 'clear-queue',
	description: 'Removes everything but the current track from the queue',
	async run(client, message) {

		// If there is no queue
		if(!client.player.isPlaying(message.guild.id)) return message.channel.send('The queue is already empty');

		// Clear the queue
		client.player.clearQueue(message.guild.id);

		// Message
		message.channel.send('Queue cleared');

	},

};
