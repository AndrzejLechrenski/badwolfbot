module.exports = {
	name: 'queue',
	description: 'View the tracks in the queue',
	async run(client, message) {

		// Get queue
		const queue = client.player.getQueue(message.guild.id);

		// If there's no music
		if(!queue) return message.channel.send('The queue is empty');

		// Message
		message.channel.send(`**Track queue**\n**1** Current - ${queue.playing.name} | **${queue.playing.duration}** | ${queue.playing.author}\n` + (
			queue.tracks.map((track, i) => {
				return `**${i + 2}** - ${track.name} | **${track.duration}** | ${track.author}`;
			}).join('\n')
		), { split:true });

	},

};
