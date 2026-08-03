const db = require("../../db");
const { SlashCommandBuilder } = require("discord.js");
const erlc = require("../../systems/erlc/getPlayers");
const { getTotalQueue } = require("../../utils/erlc/getQueue");

let sessionInterval;
let sessionMessage;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("session")
    .setDescription("Commands relating to sessions")
    .addSubcommand((subcommand) =>
      subcommand.setName("start").setDescription("Start a session"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("end").setDescription("End a session"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("vote")
        .setDescription("Start a session vote")
        .addIntegerOption((option) =>
          option
            .setName("time")
            .setDescription("When the session should start"),
        )
        .addIntegerOption((option) =>
          option
            .setName("required_votes")
            .setDescription("How many votes are required to start the session"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("logs")
        .setDescription("View recent logs for sessions"),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    const isAdmin = interaction.member.permissions.has("Administrator");

    const ROLE_IDS = [
      "1529592813380173864",
      "1529308324724736030",
      "1529307197400547469",
    ];

    const hasRoles = interaction.member.roles.cache.some((role) =>
      ROLE_IDS.includes(role.id),
    );

    if (!isAdmin && !hasRoles) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    if (sub === "start") {
      await interaction.deferReply({ ephemeral: true });

      const active = db
        .prepare(
          `
          SELECT *
          FROM sessions
          WHERE status = ?
          `,
        )
        .get("active");

      if (active) {
        return interaction.editReply({
          content: "There is an active session.",
        });
      }

      db.prepare(
        `
        INSERT INTO sessions
        (
          status,
          user_id,
          start_time
        )
        VALUES (?, ?, ?)
        `,
      ).run("active", interaction.user.id, Date.now());

      await interaction.editReply({
        content: "Session has started.",
      });

      const channel = interaction.guild.channels.cache.get(
        "1529575007217258700",
      );

      if (!channel) return;

      const createSessionComponents = async () => {
        const totalPlayers = await erlc.getTotalPlayers();
        const queue = await getTotalQueue();

        return [
          {
            type: 17,
            components: [
              {
                type: 10,
                content:
                  "# Session Startup\n\n<:lakeshore:1530640507577831676> A session has been started! Want information from ingame? See that exact info below!",
              },
              {
                type: 14,
              },
              {
                type: 10,
                content:
                  `**<:info:1532075849304637660> Server Information**\n\n` +
                  `**Server Owner:** GameWorldFun\n` +
                  `**Server Tier:** Tier 1\n` +
                  `**Server Code:** \`LAKESHORE\`\n\n` +
                  `Last Updated: <t:${Math.floor(Date.now() / 1000)}:R>`,
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 9,
                components: [
                  {
                    type: 10,
                    content:
                      "**Current In-game Players**\n-# The number of players currently in-game",
                  },
                ],
                accessory: {
                  style: 2,
                  type: 2,
                  flow: {
                    actions: [],
                  },
                  custom_id: "p_331173348321005569",
                  disabled: true,
                  label: `Players: ${totalPlayers}`,
                },
              },
              {
                type: 9,
                components: [
                  {
                    type: 10,
                    content:
                      "**Current Queue**\n-# The current queue to get into the server",
                  },
                ],
                accessory: {
                  style: 2,
                  type: 2,
                  flow: {
                    actions: [],
                  },
                  custom_id: "p_331173430437089283",
                  disabled: true,
                  label: `Queue: ${queue}`,
                },
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 12,
                items: [
                  {
                    media: {
                      url: "https://media.discordapp.net/attachments/1529315074991325215/1530981511183208579/underbanner.png",
                    },
                  },
                ],
              },
            ],
          },
        ];
      };

      sessionMessage = await channel.send({
        flags: 32768,
        components: await createSessionComponents(),
      });

      sessionInterval = setInterval(async () => {
        try {
          await sessionMessage.edit({
            components: await createSessionComponents(),
          });
        } catch (err) {
          console.error("Session update error:", err);
        }
      }, 60000);
    }

    if (sub === "end") {
      await interaction.deferReply({ ephemeral: true });

      const active = db
        .prepare(
          `
          SELECT *
          FROM sessions
          WHERE user_id = ?
          AND status = 'active'
          `,
        )
        .get(interaction.user.id);

      if (!active) {
        return interaction.editReply({
          content: "There is no active session.",
        });
      }

      db.prepare(
        `
        UPDATE sessions
        SET
          status = 'ended',
          end_time = ?
        WHERE user_id = ?
        `,
      ).run(Date.now(), interaction.user.id);

      if (sessionInterval) {
        clearInterval(sessionInterval);
        sessionInterval = null;
      }

      await interaction.editReply({
        content: "Session has ended.",
      });

      const channel = interaction.guild.channels.cache.get(
        "1529575007217258700",
      );

      if (!channel) return;

      return channel.send({
        flags: 32768,
        components: [
          {
            type: 17,
            components: [
              {
                type: 10,
                content:
                  "## Session Shutdown\n\n<:lakeshore:1530640507577831676> The session has ended. Please do not join the server while it is in shutdown as it may lead to moderation actions.\n\nWe may restart the server later, but in the mean time, it is shutdown. To get updates about the server status, click the button below!",
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 1,
                components: [
                  {
                    style: 1,
                    type: 2,
                    flow: {
                      actions: [],
                    },
                    custom_id: "session_role",
                    label: "Get Session Updates",
                  },
                ],
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 12,
                items: [
                  {
                    media: {
                      url: "https://media.discordapp.net/attachments/1529315074991325215/1530981511183208579/underbanner.png",
                    },
                  },
                ],
              },
            ],
          },
        ],
      });
    }
  },
};
