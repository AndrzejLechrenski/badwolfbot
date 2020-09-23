const settings = require('../config/settings.json');

module.exports = {
	name: 'search',
	description: 'Search YouTube and select a track from the results',
	async run(client, message, args) {

		// If no arguments
		if (!args.length) return message.channel.send(`**Usage:** \`${settings.prefix}${module.exports.name} <search string>\``).catch(console.error);

		// Search for tracks
		let tracks = await client.player.searchTracks(args.join(' '), { allResults : true });

		// Sends a message with the first 10 results (would be better if an embed?)
		if(tracks.length > 10) tracks = tracks.slice(0, 10);
		const list = await message.channel.send(`**Results:**\n${tracks.map((t, i) => `**${i + 1}  - ** ${t.name}`).join('\n')}\n*Type the number of the track you want to play!*`);

		// Wait for user answer
		await message.channel.awaitMessages((m) => m.content > 0 && m.content < 11, { max: 1, time: 20000, errors: ['time'] })
			.then(async collected => {
				const index = parseInt(collected.first().content);
				const track = tracks[index - 1];

				// Then pass the selected track url over to the play command module
				args = track.url.split();
				const player = client.commands.get('play');
				player.run(client, message, args);
				// Autodelete selection number
				message.channel.bulkDelete(collected);
				// Autodelete results list
				return message.channel.messages.delete(list.id);
			})
			.catch(async collected => {
				message.channel.send('Ok, fine. Don\'t pick anything then. They all sucked, anyway.');
				return message.channel.messages.delete(list.id);
			});

	},
};