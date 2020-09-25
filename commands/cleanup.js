module.exports = {
	name: 'cleanup',
	description: 'Cleans up the bot\'s messages',
	async run(client, message, args) {

		// Fetch all messages in text channel the message was sent from
		const allMessages = await message.channel.messages.fetch();
		// Filter messages for those sent by bots.
		const botMessages = await allMessages.filter(msg => msg.author.bot);
		// Delete bot messages. True flag ignores messages older than two weeks, because this would error.
		await message.channel.bulkDelete(botMessages, true).catch(err => {
			console.error(err);
			message.channel.send('there was an error deleting messages in this channel!');
		});

		// SLOW!!!! Don't expose this command unless you really need it.
		// Cleans messages older than 2 weeks. Might still be bugged (only deletes 3-4 and then gets stuck).
		const allRemainingMessages = await message.channel.messages.fetch();
		const deepMessages = await allRemainingMessages.filter(msg => msg.author.bot);
		if (args[0] == 'old') {
			await deepMessages.forEach(async oldMessage => {
				await message.channel.messages.delete(oldMessage);
			});
		}

		// Count how many messages we actually managed to delete
		const remainingMessages = await message.channel.messages.fetch();
		const botRemainingMessages = await remainingMessages.filter(msg => msg.author.bot);
		const botMessagesDeleted = botMessages.size - botRemainingMessages.size;

		// Send message and exit function
		if (botRemainingMessages.size > 0) return message.channel.send(`Deleted ${botMessagesDeleted} messages. ${botRemainingMessages.size} bot messages older than 2 weeks remain.`);
		else return message.channel.send(`Deleted ${botMessagesDeleted} messages.`);

	},

};