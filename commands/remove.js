module.exports = {
	name: 'remove',
	description: 'Remove a track from the queue',
	async run(client, message, args) {

		// If there's no music
		if(!client.player.isPlaying(message.guild.id)) return message.channel.send('The queue is empty');

		// Remove track
		const track = await client.player.remove(message.guild.id, parseInt(args.join(' ')) - 2);

		// Message
		message.channel.send(`\`${track.name}\` removed from the queue`);

	},

};
