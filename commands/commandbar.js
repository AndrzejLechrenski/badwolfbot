const settings = require('../config/settings.json');
const fs = require('fs');

module.exports = {
	name: 'commandbar',
	description: 'Progress bar with buttons to control the music.',
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

		const queue = await client.player.getQueue(message.guild.id);
		let volume = settings.volume;
		const playingMessage = await message.channel.send('**Track Controls**');

		try {
			await playingMessage.react('⏮');
			await playingMessage.react('⏭');
			await playingMessage.react('⏯');
			await playingMessage.react('🔉');
			await playingMessage.react('🔊');
			await playingMessage.react('🔁');
			await playingMessage.react('🔽');
			await playingMessage.react('⏹');
			await playingMessage.react('🔗');
		}
		catch (error) {
			console.error(error);
		}

		const filter = (reaction, user) => user.id !== message.client.user.id;
		const collector = playingMessage.createReactionCollector(filter, {
			time: track.duration > 0 ? track.duration * 1000 : 600000,
		});

		collector.on('collect', (reaction, user) => {
			if (!queue) return;

			switch (reaction.emoji.name) {

			case '⏮':
				reaction.users.remove(user).catch(console.error);
				client.player._playYTDLStream(queue, 0);
				message.channel.send(`${user} ⏮ restarted the track!`).catch(console.error);
				break;

			case '⏭':
				reaction.users.remove(user).catch(console.error);
				if (queue.length < 1) {
					client.player.stop(message.guild.id);
					message.channel.send(`${user} ⏩ skipped \`${track.name}\``).catch(console.error);
					collector.stop();
				}
				else {
					client.player.skip(message.guild.id);
					message.channel.send(`${user} ⏩ skipped \`${track.name}\``).catch(console.error);
				}

				break;

			case '⏯':
				reaction.users.remove(user).catch(console.error);
				if (!queue.paused) {
					client.player.pause(message.guild.id);
					message.channel.send(`${user} ⏸ paused the music.`).catch(console.error);
				}
				else if (queue.paused) {
					client.player.resume(message.guild.id);
					message.channel.send(`${user} ▶ resumed the music!`).catch(console.error);
				}
				break;

			case '🔉':
				reaction.users.remove(user).catch(console.error);
				volume = (settings.volume -= 5);
				if (volume < 0) {
					volume = 0;
					settings.volume = 0;
				}
				client.player.setVolume(message.guild.id, volume);
				message.channel.send(`${user} 🔉 decreased volume to ${volume}%`)
					.catch(console.error);
				fs.writeFile('./config/settings.json', JSON.stringify(settings), 'utf8', function (err) {
					if (err) {
						console.log('An error occured while writing volume to File.');
						return console.log(err);
					}
					console.log('Volume has been updated to the settings file');
				});
				break;

			case '🔊':
				reaction.users.remove(user).catch(console.error);
				volume = (settings.volume += 5);
				if (volume > 100) {
					volume = 100;
					settings.volume = 100;
				}
				client.player.setVolume(message.guild.id, volume);
				message.channel.send(`${user} 🔊 increased volume to ${queue.volume}%`)
					.catch(console.error);
				fs.writeFile('./config/settings.json', JSON.stringify(settings), 'utf8', function (err) {
					if (err) {
						console.log('An error occured while writing volume to File.');
						return console.log(err);
					}
					console.log('Volume has been updated to the settings file');
				});
				break;

			case '🔁':
				reaction.users.remove(user).catch(console.error);
				queue.repeatMode = !queue.repeatMode;
				message.channel.send(`Loop is now ${queue.repeatMode ? '**on**' : '**off**'}`).catch(console.error);
				break;

			case '🔽':
				reaction.users.remove(user).catch(console.error);
				message.channel.send(`**Track queue**\n **1** Current - ${queue.playing.name} | **${queue.playing.duration}** | ${queue.playing.author}\n` + (
					queue.tracks.map((track, i) => {
						return `**${i + 2}** - ${track.name} | **${track.duration}** | ${track.author}`;
					}).join('\n')
				), { split:true });
				break;

			case '⏹':
				reaction.users.remove(user).catch(console.error);
				client.player.stop(message.guild.id);
				message.channel.send(`${user} ⏹ stopped the music!`).catch(console.error);
				collector.stop();
				break;

			case '🔗':
				reaction.users.remove(user).catch(console.error);
				message.author.send(`${track.url}`);
				break;

			default:
				reaction.users.remove(user).catch(console.error);
				break;
			}
		});

		collector.on('end', () => {
			playingMessage.reactions.removeAll().catch(console.error);

		});
	},
};


// 🔉 volume down 10
// 🔊 volume up 10
// ▶ resume
// ⏸ pause
// ⏯ pause/resume toggle
// ⏹ stop
// ⏭ skip track
// ⏮ return to beginning of track
// 🔁 repeat
// 🔽 show queue

// 🔼 stop showing queue
// ⏩ ff 15 seconds
// ⏪ rwd 15 seconds
// 🔀 shuffle
// ⏏ clear queue
// ℹ instructions to use controls
// 🔗 YouTube link to current track
// 💾 save a copy of the current track
// ⏺ add track to guild playlist
// 🔃 add 10 random tracks from the guild playlist to the current queue