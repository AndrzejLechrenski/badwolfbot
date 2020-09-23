module.exports = {
	name: 'progress',
	description: 'Shows how far along the track is.',
	async run(client, message) {

		// If nothing playing
		if (!client.player.isPlaying(message.guild.id)) return message.channel.send('Nothing is playing');

		// Message and progress bar auto-update
		let track = await client.player.nowPlaying(message.guild.id);
		message.channel.send(`Currently playing: \`${track.name}\`\nProgress : ${client.player.createProgressBar(message.guild.id)}`).then((progress) => {
			async function updateBar() {
				const seconds = 3;
				track = await client.player.nowPlaying(message.guild.id);
				progress.edit(`Currently playing: \`${track.name}\`\nProgress : ${client.player.createProgressBar(message.guild.id)}`);
				if (!client.player.isPlaying(message.guild.id)) return progress.edit(`Finished playing: \`${track.name}\``);
				else setTimeout(updateBar, seconds * 1000);
			}
			if (!client.player.isPlaying(message.guild.id)) return;
			else updateBar();
		});

	},
};