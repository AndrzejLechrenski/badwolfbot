module.exports = {
	name: 'art',
	description: 'Displays the cover art of the current track.',
	async run(client, message) {
		const art = await client.player.art(message.guild.id);

		return message.channel.send(art);


	},
};