module.exports = {
	name: 'skip',
	description: 'Skips the currently playing track',
	async run(client, message) {

		// If there's no music
		if (!client.player.isPlaying(message.guild.id)) return message.channel.send('Nothing is playing');

		// Message
		const track = await client.player.skip(message.guild.id);
		return message.channel.send(`\`${track.name}\` skipped`);

	},
};
