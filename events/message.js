const settings = require('../config/settings.json');

module.exports = (client, message) => {

	// Ignore message if it is from a bot
	if (message.author.bot) return;

	// Ignore message if not sent from a guild member. Probably superfluous
	if (!message.guild) return;

	// Ignore message if it doesn't start with the prefix (in ../config/settings.json)
	const prefix = settings.prefix;
	if (message.content.indexOf(prefix) !== 0) return;

	// If the member is not in a voice channel
	if (!message.member.voice.channel) return message.channel.send(`${message.member.user} You must be in a voice channel to issue commands`).catch(console.error);

	// Parse the command
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	// Grab the command data from the client.commands Enmap (read from ../commands)
	const cmd = client.commands.get(command);

	// If that command doesn't exist
	if (!cmd) return message.channel.send(`\`${message.content.slice(prefix.length)}\` is not a recognized commmand.`);

	// Delete user command message after cooldown (from ../config/settings.json) expires
	if (settings.userPruning) {
		setTimeout(() => message.delete(), settings.cooldown * 1000);
	}

	// Run the command
	try {
		cmd.run(client, message, args);
	}
	catch (error) {
		console.error(error);
		message.reply(`Error executing \`${cmd.name}\``).catch(console.error);
	}

};
