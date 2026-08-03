const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");

const play = require("play-dl");

module.exports = {
  name: "play",

  async execute(client, message, args) {
    const query = args.join(" ");

    if (!query) {
      return message.reply("Provide a song name.");
    }

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      return message.reply("You need to be in a voice channel.");
    }

    try {
      const results = await play.search(query, {
        limit: 1,
      });

      if (!results.length) {
        return message.reply("Song not found.");
      }

      const song = results[0];

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      const stream = await play.stream(song.url);

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      const player = createAudioPlayer();

      player.play(resource);

      connection.subscribe(player);

      await message.reply(
        `Playing **${song.title}** by **${song.channel.name}**`,
      );

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      player.on("error", (error) => {
        console.error("Audio Error:", error);
      });
    } catch (error) {
      console.error(error);

      message.reply("I could not play that song.");
    }
  },
};
