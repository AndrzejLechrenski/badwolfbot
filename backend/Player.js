const ytdl = require('discord-ytdl-core');
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const spotify = require('spotify-url-info');
const Queue = require('./Queue');
const Track = require('./Track');
const settings = require('../config/settings.json');

/**
 * @typedef PlayerOptions
 * @property {boolean} [leaveOnEnd=true] Whether the bot should leave the current voice channel when the queue ends.
 * @property {boolean} [leaveOnStop=true] Whether the bot should leave the current voice channel when the stop() function is used.
 * @property {boolean} [leaveOnEmpty=true] Whether the bot should leave the voice channel if there is no more member in it.
 */

/**
 * Default options for the player
 * @ignore
 * @type {PlayerOptions}
 */

const defaultPlayerOptions = {
	leaveOnEnd: false,
	leaveOnStop: false,
	leaveOnEmpty: true,
};

class Player {

	/**
	* @param {Discord.Client} client Discord.js client
	* @param {PlayerOptions} options Player options
	*/

	constructor(client, options = {}) {
		if (!client) throw new SyntaxError('Invalid Discord client');

		/**
         * Discord.js client instance
         * @type {Discord.Client}
         */

		this.client = client;

		/**
         * Player queues
         * @type {Queue[]}
         */

		this.queues = [];

		/**
         * Player options
         * @type {PlayerOptions}
         */

		this.options = defaultPlayerOptions;
		for (const prop in options) {
			this.options[prop] = options[prop];
		}

		// Listener to check if the channel is empty
		client.on('voiceStateUpdate', (oldState, newState) => this._handleVoiceStateUpdate(oldState, newState));
	}


	art(guildID) {
		return new Promise((resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			// Get the art
			const art = queue.playing.thumbnail;
			// Resolve the promise
			resolve(art);
		});
	}

	/**
     * Resolve an array of tracks objects from a query string
     * @param {string} query The query
     * @param {boolean} allResults Whether all the results should be returned, or only the first one
     * @returns {Promise<Track[]>}
     *
     * @example
     * client.on('message', async (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      if(command === 'play'){
     *          // Search for tracks
     *          let tracks = await client.player.searchTracks(args[0]);
     *          // Sends an embed with the 10 first songs
     *          if(tracks.length > 10) tracks = tracks.slice(0, 10);
     *          const embed = new Discord.MessageEmbed()
     *          .setDescription(tracks.map((t, i) => `**${i+1} -** ${t.name}`).join("\n"))
     *          .setFooter("Send the number of the track you want to play!");
     *          message.channel.send(embed);
     *          // Wait for user answer
     *          await message.channel.awaitMessages((m) => m.content > 0 && m.content < 11, { max: 1, time: 20000, errors: ["time"] }).then(async (answers) => {
     *              let index = parseInt(answers.first().content, 10);
     *              track = track[index-1];
     *              // Then play the song
     *              client.player.play(message.member.voice.channel, track);
     *          });
     *      }
     *
     * });
     */

	async searchTracks(query, allResults = false) {
		return new Promise(async (resolve, reject) => {
			if (ytpl.validateID(query)) {
				const playlistID = await ytpl.getPlaylistID(query).catch(err => console.error(err));
				if (playlistID) {
					const playlist = await ytpl(playlistID).catch(err => console.error(err));
					if (playlist) {
						return resolve(playlist.items.map((i) => new Track({
							title: i.title,
							duration: i.duration,
							thumbnail: i.thumbnail,
							author: i.author,
							link: i.url,
							fromPlaylist: true,
						}, null, null)));
					}
				}
			}
			const matchSpotifyURL = query.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/);
			if (matchSpotifyURL) {
				const spotifyData = await spotify.getPreview(query).catch(e => resolve([]));
				query = `${spotifyData.artist} - ${spotifyData.track}`;
			}
			// eslint-disable-next-line no-useless-escape
			const matchYoutubeURL = query.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
			if (matchYoutubeURL) {
				query = `"${matchYoutubeURL[1]}"`;
			}
			await ytsr(query).then((results) => {
				if (results.items.length < 1) return resolve([]);
				const resultsVideo = results.items.filter((i) => i.type === 'video');
				resolve(allResults ? resultsVideo.map((r) => new Track(r, null, null)) : [new Track(resultsVideo[0], null, null)]);
			}).catch(() => {
				return resolve([]);
			});
		});
	}

	/**
     * Whether a guild is currently playing something
     * @param {Discord.Snowflake} guildID The guild ID to check
     * @returns {boolean} Whether the guild is currently playing tracks
     */

	isPlaying(guildID) {
		return this.queues.some((g) => g.guildID === guildID);
	}

	/**
     * Play a track in a voice channel
     * @param {Discord.VoiceChannel} voiceChannel The voice channel in which the track will be played
     * @param {Track|string} track The name of the track to play
     * @param {Discord.User?} user The user who requested the track
     * @returns {any} The played content
     *
     * @example
     * client.on('message', async (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      // !play Despacito
     *      // will play "Despacito" in the member voice channel
     *
     *      if(command === 'play'){
     *          const result = await client.player.play(message.member.voice.channel, args.join(" "));
     *          if(result.type === 'playlist'){
     *              message.channel.send(`${result.tracks.length} songs added to the queue!\nCurrently playing **${result.tracks[0].name}**...`);
     *          } else {
     *              message.channel.send(`Currently playing ${result.name}...`);
     *          }
     *      }
     *
     * });
     */

	async play(voiceChannel, track, user) {
		this.queues = this.queues.filter((g) => g.guildID !== voiceChannel.id);
		return new Promise(async (resolve, reject) => {
			if (!voiceChannel || typeof voiceChannel !== 'object') {
				return reject(new Error(`voiceChannel must be type of VoiceChannel. value=${voiceChannel}`));
			}
			const connection = voiceChannel.client.voice.connections.find((c) => c.channel.id === voiceChannel.id) || await voiceChannel.join();

			// Create a new guild with data
			const queue = new Queue(voiceChannel.guild.id);
			queue.voiceConnection = connection;
			queue.filters = {};
			let result = null;
			if (typeof track === 'object') {
				track.requestedBy = user;
				result = track;

				// Add the track to the queue
				queue.tracks.push(track);
			}
			else if (typeof track === 'string') {
				const results = await this.searchTracks(track).catch(() => {
					return reject(new Error('Not found'));
				});
				if (!results) return;
				if (results.length > 1) {
					result = {
						type: 'playlist',
						tracks: results,
					};
				}
				else if (results[0]) {
					result = results[0];
				}
				else {
					return reject(new Error('Not found'));
				}
				results.forEach((i) => {
					i.requestedBy = user;
					queue.tracks.push(i);
				});
			}

			// Add the queue to the list
			this.queues.push(queue);

			// Play the track
			this._playTrack(queue.guildID, true);

			// Resolve the track
			resolve(result);
		});
	}

	/**
     * Pause the current track
     * @param {Discord.Snowflake} guildID The ID of the guild where the current track should be paused
     * @returns {Promise<Track>} The paused track
     *
     * @example
     * client.on('message', async (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      if(command === 'pause'){
     *          const track = await client.player.pause(message.guild.id);
     *          message.channel.send(`${track.name} paused!`);
     *      }
     *
     * });
     */

	pause(guildID) {
		return new Promise((resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			// Pause the dispatcher
			queue.voiceConnection.dispatcher.pause();
			queue.paused = true;
			// Resolve the guild queue
			resolve(queue.playing);
		});
	}

	/**
     * Resume the current track
     * @param {Discord.Snowflake} guildID The ID of the guild where the current track should be resumed
     * @returns {Promise<Track>} The resumed track
     *
     * @example
     * client.on('message', async (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      if(command === 'resume'){
     *          const track = await client.player.resume(message.guild.id);
     *          message.channel.send(`${track.name} resumed!`);
     *      }
     *
     * });
     */

	resume(guildID) {
		return new Promise((resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			// Pause the dispatcher
			queue.voiceConnection.dispatcher.resume();
			queue.paused = false;
			// Resolve the guild queue
			resolve(queue.playing);
		});
	}

	/**
     * Stop the music in the guild
     * @param {Discord.Snowflake} guildID The ID of the guild where the music should be stopped
     * @returns {Promise<void>}
     *
     * @example
     * client.on('message', (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      if(command === 'stop'){
     *          client.player.stop(message.guild.id);
     *          message.channel.send('Music stopped!');
     *      }
     *
     * });
     */

	stop(guildID) {
		return new Promise((resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			// Stop the dispatcher
			queue.stopped = true;
			queue.tracks = [];
			if (queue.stream) queue.stream.destroy();
			queue.voiceConnection.dispatcher.end();
			// Resolve
			resolve();
		});
	}

	/**
     * Update the volume
     * @param {Discord.Snowflake} guildID The ID of the guild where the music should be modified
     * @param {number} percent The new volume (0-100)
     * @returns {Promise<void>}
     *
     * @example
     * client.on('message', (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      if(command === 'set-volume'){
     *          client.player.setVolume(message.guild.id, parseInt(args[0]));
     *          message.channel.send(`Volume set to ${args[0]} !`);
     *      }
     *
     * });
     */

	setVolume(guildID, percent) {
		return new Promise((resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			// Update volume
			queue.volume = percent;
			queue.voiceConnection.dispatcher.setVolumeLogarithmic(settings.volume / 100);
			// Resolve guild queue
			resolve();
		});
	}

	/**
     * Get a guild queue
     * @param {Discord.Snowflake} guildID
     * @returns {?Queue}
     *
     * @example
     * client.on('message', (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      if(command === 'queue'){
     *          const queue = await client.player.getQueue(message.guild.id);
     *          message.channel.send('Server queue:\n'+(queue.tracks.map((track, i) => {
     *              return `${i === 0 ? 'Current' : `#${i+1}`} - ${track.name} | ${track.author}`;
     *          }).join('\n')));
     *      }
     *
     *      // Output:
     *
     *      // Server queue:
     *      // Current - Despacito | Luis Fonsi
     *      // #2 - Memories | Maroon 5
     *      // #3 - Dance Monkey | Tones And I
     *      // #4 - Circles | Post Malone
     * });
     */

	getQueue(guildID) {
		// Gets guild queue
		const queue = this.queues.find((g) => g.guildID === guildID);
		return queue;
	}

	/**
     * Add a track to the guild queue
     * @param {Discord.Snowflake} guildID The ID of the guild where the track should be added
     * @param {Track|string} trackName The name of the track to add to the queue
     * @param {Discord.User?} user The user who requested the track
     * @returns {any} The content added to the queue
     *
     * @example
     * client.on('message', async (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      if(command === 'play'){
     *          let trackPlaying = client.player.isPlaying(message.guild.id);
     *          // If there's already a track being played
     *          if(trackPlaying){
     *              const result = await client.player.addToQueue(message.guild.id, args.join(" "));
     *              if(result.type === 'playlist'){
     *                  message.channel.send(`${result.tracks.length} songs added to the queue!`);
     *              } else {
     *                  message.channel.send(`${result.name} added to the queue!`);
     *              }
     *          } else {
     *              // Else, play the track
     *              const result = await client.player.addToQueue(message.member.voice.channel, args[0]);
     *              if(result.type === 'playlist'){
     *                  message.channel.send(`${result.tracks.length} songs added to the queue\nCurrently playing **${result.tracks[0].name}**!`);
     *              } else {
     *                  message.channel.send(`Currently playing ${result.name}`);
     *              }
     *          }
     *      }
     *
     * });
     */

	addToQueue(guildID, track, user) {
		return new Promise(async (resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			// Search the track
			let result = null;
			if (typeof track === 'object') {
				track.requestedBy = user;
				result = track;
				// Add the track to the queue
				queue.tracks.push(track);
			}
			else if (typeof track === 'string') {
				const results = await this.searchTracks(track).catch(() => {
					return reject(new Error('Not found'));
				});
				if (!results) return;
				if (results.length > 1) {
					result = {
						type: 'playlist',
						tracks: results,
					};
				}
				else if (results[0]) {
					result = results[0];
				}
				else {
					return reject(new Error('Not found'));
				}
				results.forEach((i) => {
					i.requestedBy = user;
					queue.tracks.push(i);
				});
			}
			// Resolve the result
			resolve(result);
		});
	}

	/**
     * Clear the guild queue, except the current track
     * @param {Discord.Snowflake} guildID The ID of the guild where the queue should be cleared
     * @returns {Promise<Queue>} The updated queue
     *
     * @example
     * client.on('message', (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      if(command === 'clear-queue'){
     *          client.player.clearQueue(message.guild.id);
     *          message.channel.send('Queue cleared!');
     *      }
     *
     * });
     */

	clearQueue(guildID) {
		return new Promise((resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			// Clear queue
			queue.tracks = [];
			// Resolve guild queue
			resolve(queue);
		});
	}

	/**
     * Skip a track
     * @param {Discord.Snowflake} guildID The ID of the guild where the track should be skipped
     * @returns {Promise<Track>}
     *
     * @example
     * client.on('message', async (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      if(command === 'skip'){
     *          const track = await client.player.skip(message.guild.id);
     *          message.channel.send(`${track.name} skipped!`);
     *      }
     *
     * });
     */

	skip(guildID) {
		return new Promise((resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			const currentTrack = queue.playing;
			// End the dispatcher
			queue.voiceConnection.dispatcher.end();
			queue.lastSkipped = true;
			// Resolve the current track
			resolve(currentTrack);
		});
	}

	/**
     * Get the currently playing track
     * @param {Discord.Snowflake} guildID
     * @returns {Promise<Track>} The track which is currently played
     *
     * @example
     * client.on('message', async (message) => {
     *
     *      const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *      const command = args.shift().toLowerCase();
     *
     *      if(command === 'now-playing'){
     *          let track = await client.player.nowPlaying(message.guild.id);
     *          message.channel.send(`Currently playing ${track.name}...`);
     *      }
     *
     * });
     */

	nowPlaying(guildID) {
		return new Promise((resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			const currentTrack = queue.playing;
			// Resolve the current track
			resolve(currentTrack);
		});
	}

	/**
     * Enable or disable the repeat mode
     * @param {Discord.Snowflake} guildID
     * @param {Boolean} enabled Whether the repeat mode should be enabled
     * @returns {Promise<Void>}
     *
     * @example
     * client.on('message', async (message) => {
     *
     *     const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *     const command = args.shift().toLowerCase();
     *
     *     if(command === 'repeat-mode'){
     *         const repeatModeEnabled = client.player.getQueue(message.guild.id).repeatMode;
     *         if(repeatModeEnabled){
     *              // if the repeat mode is currently enabled, disable it
     *              client.player.setRepeatMode(message.guild.id, false);
     *              message.channel.send("Repeat mode disabled! The current song will no longer be played again and again...");
     *         } else {
     *              // if the repeat mode is currently disabled, enable it
     *              client.player.setRepeatMode(message.guild.id, true);
     *              message.channel.send("Repeat mode enabled! The current song will be played again and again until you run the command again!");
     *         }
     *     }
     *
     * });
     */

	setRepeatMode(guildID, enabled) {
		return new Promise((resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			// Enable/Disable repeat mode
			queue.repeatMode = enabled;
			// Resolve
			resolve();
		});
	}

	/**
     * Shuffle the guild queue (except the first track)
     * @param {Discord.Snowflake} guildID The ID of the guild where the queue should be shuffled
     * @returns {Promise<Queue>} The updated queue
     *
     * @example
     * client.on('message', async (message) => {
     *
     *     const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *     const command = args.shift().toLowerCase();
     *
     *     if(command === 'shuffle'){
     *         // Shuffle the server queue
     *         client.player.shuffle(message.guild.id).then(() => {
     *              message.channel.send('Queue shuffled!');
     *         });
     *      }
     *
     * });
     */

	shuffle(guildID) {
		return new Promise((resolve, reject) => {
			// Get guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			// Shuffle the queue (except the first track)
			const currentTrack = queue.tracks.shift();
			queue.tracks = queue.tracks.sort(() => Math.random() - 0.5);
			queue.tracks.unshift(currentTrack);
			// Resolve
			resolve(queue);
		});
	}

	/**
     * Remove a track from the queue
     * @param {Discord.Snowflake} guildID The ID of the guild where the track should be removed
     * @param {number|Track} track The index of the track to remove or the track to remove object
     * @returns {Promise<Track|null>}
     *
     * @example
     * client.on('message', async (message) => {
     *
     *     const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *     const command = args.shift().toLowerCase();
     *
     *     if(command === 'remove'){
     *         // Remove a track from the queue
     *         client.player.remove(message.guild.id, args[0]).then(() => {
     *              message.channel.send('Removed track!');
     *         });
     *      }
     *
     * });
     */

	remove(guildID, track) {
		return new Promise((resolve, reject) => {
			// Gets guild queue
			const queue = this.queues.find((g) => g.guildID === guildID);
			if (!queue) return reject(new Error('Not playing'));
			// Remove the track from the queue
			let trackFound = null;
			if (typeof track === 'number') {
				trackFound = queue.tracks[track];
				if (trackFound) {
					queue.tracks = queue.tracks.filter((t) => t !== trackFound);
				}
			}
			else {
				trackFound = queue.tracks.find((s) => s === track);
				if (trackFound) {
					queue.tracks = queue.tracks.filter((s) => s !== trackFound);
				}
			}
			// Resolve
			resolve(trackFound);
		});
	}

	/**
     * Creates progress bar of the current song
     * @param {Discord.Snowflake} guildID
     * @returns {String}
     *
     * @example
     * client.on('message', async (message) => {
     *
     *     const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
     *     const command = args.shift().toLowerCase();
     *
     *     if(command === 'now-playing'){
     *         client.player.nowPlaying(message.guild.id).then((song) => {
     *              message.channel.send('Currently playing ' + song.name + '\n\n'+ client.player.createProgressBar(message.guild.id));
     *         });
     *      }
     *
     * });
     */

	createProgressBar(guildID) {
		// Gets guild queue
		const queue = this.queues.find((g) => g.guildID === guildID);
		if (!queue) return;
		// Stream time of the dispatcher
		const currentStreamTime = queue.voiceConnection.dispatcher ? queue.voiceConnection.dispatcher.streamTime + queue.additionalStreamTime : 0;
		// Convert stream time to play time
		function playTime() {
			const minutes = Math.floor(currentStreamTime / 60000);
			const seconds = ((currentStreamTime % 60000) / 1000).toFixed(0);
			return (seconds == 60 ? (minutes + 1) + ':00' : minutes + ':' + (seconds < 10 ? '0' : '') + seconds);
		}
		// Total stream time
		const totalTime = queue.playing.durationMS;
		// Stream progress
		const index = Math.round((currentStreamTime / totalTime) * 20);
		// conditions
		if ((index >= 1) && (index <= 20)) {
			const bar = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'.split('');
			bar.splice(index, 0, '🔘');
			return `\`${playTime()}\`` + ' [' + bar.join('') + `] \`${queue.playing.duration}\``;
		}
		else {
			return `\`${playTime()}\`` + ' [' + '🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬' + `] \`${queue.playing.duration}\``;
		}
	}

	/**
     * Handle the voice state update event
     * @ignore
     * @private
     * @param {Discord.VoiceState} oldState
     * @param {Discord.VoiceState} newState
     */

	_handleVoiceStateUpdate(oldState, newState) {
		if (!this.options.leaveOnEmpty) return;
		// If the member leaves a voice channel
		if (!oldState.channelID || newState.channelID) return;
		// Search for a queue for this channel
		const queue = this.queues.find((g) => g.voiceConnection.channel.id === oldState.channelID);
		if (queue) {
			// If the channel is not empty
			if (queue.voiceConnection.channel.members.size > 1) return;
			// Disconnect from the voice channel
			queue.voiceConnection.channel.leave();
			// Delete the queue
			this.queues = this.queues.filter((g) => g.guildID !== queue.guildID);
			// Emit end event
			queue.emit('channelEmpty');
		}
	}

	/**
     * Play a stream in a channel
     * @ignore
     * @private
     * @param {Queue} queue The queue to play
     * @param {Boolean} updateFilter Whether this method is called to update some ffmpeg filters
     * @returns {Promise<void>}
     */

	async _playYTDLStream(queue, seekTime) {
		return new Promise((resolve) => {
			const encoderArgs = [];
			const newStream = ytdl(queue.playing.url, {
				filter: 'audioonly',
				opusEncoded: true,
				encoderArgs,
				seek: seekTime,
				highWaterMark: 1 << 25,
			});
			setTimeout(() => {
				if (queue.stream) queue.stream.destroy();
				queue.stream = newStream;
				queue.voiceConnection.play(newStream, {
					type: 'opus',
					bitrate: 'auto',
				});
				if (seekTime) {
					queue.additionalStreamTime = seekTime * 1000;
				}
				queue.voiceConnection.dispatcher.setVolumeLogarithmic(settings.volume / 100);
				// When the track starts
				queue.voiceConnection.dispatcher.on('start', () => {
					resolve();
				});
				// When the track ends
				queue.voiceConnection.dispatcher.on('finish', () => {
					// Reset streamTime
					queue.additionalStreamTime = 0;
					// Play the next track
					return this._playTrack(queue.guildID, false);
				});
			}, 1000);
		});
	}

	/**
     * Start playing a track in a guild
     * @ignore
     * @private
     * @param {Discord.Snowflake} guildID
     * @param {Boolean} firstPlay Whether the function was called from the play() one
     */

	async _playTrack(guildID, firstPlay) {
		// Get guild queue
		const queue = this.queues.find((g) => g.guildID === guildID);
		// If there isn't any music in the queue
		if (queue.tracks.length < 1 && !firstPlay && !queue.repeatMode) {
			// Leave the voice channel
			if (this.options.leaveOnEnd && !queue.stopped) queue.voiceConnection.channel.leave();
			// Remove the guild from the guilds list
			this.queues = this.queues.filter((g) => g.guildID !== guildID);
			// Emit stop event
			if (queue.stopped) {
				if (this.options.leaveOnStop) queue.voiceConnection.channel.leave();
				return queue.emit('stop');
			}
			// Emit end event
			return queue.emit('end');
		}
		const wasPlaying = queue.playing;
		const nowPlaying = queue.playing = queue.repeatMode ? wasPlaying : queue.tracks.shift();
		// Reset lastSkipped state
		queue.lastSkipped = false;
		await this._playYTDLStream(queue, 0).then(() => {
			// Emit trackChanged event
			if (!firstPlay) {
				queue.emit('trackChanged', wasPlaying, nowPlaying, queue.lastSkipped, queue.repeatMode);
			}
		});
	}
}

module.exports = Player;