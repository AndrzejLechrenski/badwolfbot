module.exports = {
	name: 'play',
	description: 'Play a YouTube link, Spotify link, or Artist - Title',
	usage: ['<youtube link>', '<spotify link>', 'Artist - Title'],
	examples: ['https://www.youtube.com/watch?v=lDC4X8Dgxr4', 'https://open.spotify.com/track/2SRMzskYrb5LWYeSnC3oxQ', 'Mega Man 2 - Dr. Wily\'s Castle'],
	async run(client, message, args) {

		// If no tracks are given
		if (!args[0]) {
			const track = await client.player.resume(message.guild.id);
			if(!track) return message.channel.send('Enter a YouTube link, Spotify link, or `Artist - Title`');
			return message.channel.send(`Current track: \`${track.name}\` resumed`);
		}

		// If there's already a track playing
		const alreadyPlaying = await client.player.isPlaying(message.guild.id);
		if(alreadyPlaying) {

			// Add the track to the queue
			const result = await client.player.addToQueue(message.guild.id, args.join(' '));
			if(!result) return message.channel.send('No results');

			if(result.type === 'playlist') {
				message.channel.send(`**${result.tracks.length}** tracks added to the queue`);
			}

			else {
				message.channel.send(`\`${result.name}\` added to the queue`);
			}

		}

		else {

			// Else, play the track
			const result = await client.player.play(message.member.voice.channel, args.join(' '));
			if(!result) return message.channel.send('No results');

			if(result.type === 'playlist') {
				message.channel.send(`**${result.tracks.length}** tracks added to the queue\nCurrently playing: \`${result.tracks[0].name}\``);
			}

			else {
				message.channel.send(`Currently playing: \`${result.name}\``);
			}

			const queue = client.player.getQueue(message.guild.id)

			// Events
				.on('end', () => {
					message.channel.send('Queue is now empty');
				})
				.on('trackChanged', (oldTrack, newTrack) => {
					message.channel.send(`Now playing: \`${newTrack.name}\``);
				})
				.on('channelEmpty', () => {
					message.channel.send('Playing stopped because I\'m lonely and I need to go cry');
				});

			return queue.paused = false;
		}
	},
};