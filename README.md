# Bad Wolf Bot
A Discord music bot with several functions that occasionally work.

## Requirements : 

Node.js

discord.js (installed through npm)

discord-ytdl-core (installed through npm)

ytsr (installed through npm)

ytpl (installed through npm)

spotify-url-info (installed through npm)

env (installed through npm)

[ffmpeg](https://ffmpeg.org/download.html)

## Setup : 

Create a file in the bot root directory named ".env" with the following contents
``` 
DISCORD_TOKEN=<yourdiscordtoken>
```
where <yourdiscordtoken> is taken from the bot token you create at https://discord.com/developers/applications

For the time being, "ffmpeg.exe" must be in the root directory.

## Execution :
On windows, just use "run.bat"

otherwise:
```
node index.js
```

## Acknowledgements : 
Bad Wolf Bot currently uses a modified version of Androz2091's ["discord-player"](https://github.com/Androz2091/discord-player) module for its backend

Bad Wolf Bot took inspiration from ZerioDev's ["Music-bot"](https://github.com/ZerioDev/Music-bot)
