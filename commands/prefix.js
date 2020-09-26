module.exports = {
	name: 'prefix',
	description: 'Change the command prefix.',
	usage: ['<new prefix>'],
	example: ['!'],
	async run(client, message, args) {

		// Message for Jackal
		return message.channel.send('Jackal, fuck you. I won\'t let you murder me like you murdered all the others.', { tts: true });

	},

};