# Bad Wolf Bot
A Discord music bot with several functions that occasionally work.

## Requirements : 

Node.js

discord.js (installed through npm)

discord-ytdl-core (installed through npm)

ytsr (installed through npm)

ytpl (installed through npm)

spotify-url-info (installed through npm)

[ffmpeg](https://ffmpeg.org/download.html)

## Setup : 

Create a file in ./config named "security.json" with the following contents
``` 
{
	"discordToken"	:	"yourdiscordtoken"
}
```
where "yourdiscordtoken" is taken from the bot token you create at https://discord.com/developers/applications

## Execution :
On windows, just use "run.bat"

otherwise:
```
node index.js
```

## Acknowledgements : 
Bad Wolf Bot currently uses a modified version of Androz2091's "discord-player" module for it's backend 
Bad Wolf Bot took inspiration from ZerioDev's "Music-bot"
