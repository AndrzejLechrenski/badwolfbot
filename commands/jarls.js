const https = require('https');

module.exports = {
	name: 'jarls',
	description: 'Look up a pilot on The Jarl\'s List',
	async run(client, message, args) {

		const query = `https://leaderboard.isengrim.org/api/usernames/${args.join(' ')}`;
		https.get(query, (res) => {
			res.on('data', (d) => {
				const jarls = JSON.parse(d);
				message.channel.send(
					'PilotName: ' + jarls.PilotName + '\n' +
					'Percentile: ' + jarls.Percentile + '%' + '\n' +
					'W/L Ratio: ' + jarls.WLRatio + '\n' +
					'K/D Ratio: ' + jarls.KDRatio + '\n' +
					'Games Played: ' + jarls.GamesPlayed + '\n' +
					'Average Match Score: ' + jarls.AverageMatchScore + '\n' +
					'Adjusted Score: ' + jarls.AdjustedScore + '\n' +
					'Light Percent: ' + jarls.LightPercent + '%' + '\n' +
					'Medium Percent: ' + jarls.MediumPercent + '%' + '\n' +
					'Heavy Percent: ' + jarls.HeavyPercent + '%' + '\n' +
					'Assault Percent: ' + jarls.AssaultPercent + '%');

			});

		}).on('error', (e) => {
			console.error(e);
		});

	},

};
