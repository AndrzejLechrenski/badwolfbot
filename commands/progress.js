module.exports = {
	name: 'progress',
	description: 'Shows how far along the track is.',
	async run(client, message) {

		// If nothing playing
		if (!client.player.isPlaying(message.guild.id)) return message.channel.send('Nothing is playing');


		// Send a message with the track and the progress bar
		let track = await client.player.nowPlaying(message.guild.id);
		message.channel.send(`Currently playing: \`${track.name}\`\nProgress : ${client.player.createProgressBar(message.guild.id)}`).then((progress) => {
			// We are going to be editing this message
			async function updateBar() {
				// First make sure the queue hasn't finished already
				if (!client.player.isPlaying(message.guild.id)) return progress.edit(`Finished playing: \`${track.name}\``);
				// Make sure the message wasn't deleted
				if (!progress) return;
				// Set a timer
				const seconds = 3;
				// Update the track in case it changed
				track = await client.player.nowPlaying(message.guild.id);
				// Push the edit to the message
				progress.edit(`Currently playing: \`${track.name}\`\nProgress : ${client.player.createProgressBar(message.guild.id)}`);
				// Above tasks repeat based on the timer
				setTimeout(updateBar, seconds * 1000);
			}
			// Execute the update function
			if (client.player.isPlaying(message.guild.id)) updateBar();
			// Get us out of this loop
			else return progress.edit(`Finished playing: \`${track.name}\``);
		});

	},
};