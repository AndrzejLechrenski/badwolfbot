module.exports = {
	name: 'resume',
	description: 'Resume playing if paused',
	async run(client, message) {

		// Get track and resume it
		const track = await client.player.resume(message.guild.id);

		// If there is nothing to resume
		if(!track) return message.channel.send('Nothing is playing');

		// Message
		return message.channel.send(`Current track: \`${track.name}\` resumed`);
	},
};
