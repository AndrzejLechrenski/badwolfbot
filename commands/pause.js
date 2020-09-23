module.exports = {
	name: 'pause',
	description: 'Pause the current track',
	async run(client, message) {

		// If there's no music
		if(!client.player.isPlaying(message.guild.id)) return message.channel.send('Nothing is playing');

		const track = await client.player.pause(message.guild.id);

		// Message
		message.channel.send(`Current track: \`${track.name}\` paused`);
	},
};
