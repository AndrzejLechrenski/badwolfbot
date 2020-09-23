const settings = require('../config/settings.json');

module.exports = async (client) => {

	// When the bot logs in, it sends these messages to the console
	console.log('Reactor Online!');
	console.log(`Sensors online for ${client.guilds.cache.size} servers!`);
	console.log(`Music online for ${client.users.cache.size} users!`);
	console.log('All systems nominal!');

	// Reads the bot's Discord status from the settings file
	client.user.setActivity(settings.status);

};
