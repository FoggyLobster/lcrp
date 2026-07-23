const { EmbedBuilder } = require("discord.js");
const db = require("../../db");

const RANK_REQUIREMENTS = [
  {
    name: "Moderator",
    roleId: "1529307204987912343",
    required: 90 * 60 * 1000,
  },
  {
    name: "Administrator",
    roleId: "1529307197400547469",
    required: 2 * 60 * 60 * 1000,
  },
  {
    name: "IA",
    roleId: "1529308324724736030",
    required: 60 * 60 * 1000,
  },
];

const LOG_CHANNEL_ID = "1529940408950456381";

function formatTime(ms) {
  if (!ms || ms <= 0) return "0s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const s = seconds % 60;
  const m = minutes % 60;

  let output = "";

  if (hours > 0) {
    output += `${hours}hr `;
  }

  if (m > 0) {
    output += `${m}m `;
  }

  if (s > 0) {
    output += `${s}s`;
  }

  return output.trim();
}

function genId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let id = "";

  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
}

module.exports = {
  name: "inactivities",

  async execute(client, message) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply({
        content: "You do not have permission.",
      });
    }

    await message.guild.members.fetch();

    await message.channel.send({
      content: "Checking staff activity...",
    });

    const infractions = [];
    let checked = 0;

    for (const member of message.guild.members.cache.values()) {
      if (member.user.bot) {
        continue;
      }

      const rank = RANK_REQUIREMENTS.find((role) =>
        member.roles.cache.has(role.roleId),
      );

      if (!rank) {
        continue;
      }

      checked++;

      const result = db
        .prepare(
          `
        SELECT SUM(total_time) AS time
        FROM shifts
        WHERE user_id = ?
      `,
        )
        .get(member.id);

      const totalTime = result.time || 0;

      if (totalTime >= rank.required) {
        continue;
      }

      const infractionId = genId();

      const previous = db
        .prepare(
          `
        SELECT COUNT(*) AS count
        FROM infractions
        WHERE user_id = ?
      `,
        )
        .get(member.id);

      db.prepare(
        `
        INSERT INTO infractions
        (
          id,
          user_id,
          infraction_type,
          reason,
          issued_by,
          issued_at,
          total_infractions
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        infractionId,
        member.id,
        "Inactivity",
        "Failed to meet required shift quota",
        "System",
        Date.now(),
        previous.count + 1,
      );

      const embed = new EmbedBuilder()
        .setTitle("Inactivity Infraction")
        .setDescription(
          `You have received an inactivity infraction.

**Rank**
${rank.name}

**Required Activity**
${formatTime(rank.required)}

**Completed Activity**
${formatTime(totalTime)}

**Infraction ID**
\`${infractionId}\`

Please complete your required activity time.`,
        )
        .setColor(0xff0000)
        .setTimestamp();

      await member
        .send({
          embeds: [embed],
        })
        .catch(() => {});

      infractions.push({
        member,
        rank,
        totalTime,
        id: infractionId,
      });
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle("Inactivity Check Complete")
      .setDescription(
        infractions.length
          ? infractions
              .map(
                (i) =>
                  `<@${i.member.id}> 
Rank: ${i.rank.name}
Time: ${formatTime(i.totalTime)}
ID: \`${i.id}\``,
              )
              .join("\n\n")
          : "No infractions issued.",
      )
      .addFields(
        {
          name: "Staff Checked",
          value: `${checked}`,
          inline: true,
        },
        {
          name: "Infractions Issued",
          value: `${infractions.length}`,
          inline: true,
        },
      )
      .setColor(0xff0000)
      .setTimestamp();

    await message.channel.send({
      embeds: [resultEmbed],
    });

    const logChannel = await message.guild.channels
      .fetch(LOG_CHANNEL_ID)
      .catch(() => null);

    if (logChannel?.isTextBased()) {
      const logEmbed = new EmbedBuilder()
        .setTitle("Inactivity System Log")
        .setDescription(
          `An inactivity check has been completed.

**Executed By**
${message.author}

**Staff Checked**
${checked}

**Infractions Issued**
${infractions.length}`,
        )
        .setColor(0xff0000)
        .setTimestamp();

      if (infractions.length) {
        logEmbed.addFields({
          name: "Issued Infractions",
          value: infractions
            .map(
              (i) =>
                `<@${i.member.id}> - ${i.rank.name} - ${formatTime(i.totalTime)} - \`${i.id}\``,
            )
            .join("\n")
            .slice(0, 1024),
        });
      }

      await logChannel.send({
        embeds: [logEmbed],
      });
    }
  },
};
