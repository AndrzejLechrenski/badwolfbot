module.exports = {
	name: 'cleanup',
	description: 'Cleans up the bot\'s messages',
	async run(client, message) {

		await message.channel.messages.fetch().then(async allMessages => {
			const botMessages = await allMessages.filter(msg => msg.author.bot);
			message.channel.send(`Deleted ${botMessages.size} bot messages`);
			return await message.channel.bulkDelete(botMessages, true);

		}).catch(console.error);

	},

};