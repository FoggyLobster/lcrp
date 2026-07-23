const { EmbedBuilder } = require("discord.js");
const db = require("../../db");

const RANK_REQUIREMENTS = [
  {
    name: "Moderator",
    roleId: "MODERATOR_ROLE_ID",
    required: 90 * 60 * 1000,
  },
  {
    name: "Administrator",
    roleId: "ADMINISTRATOR_ROLE_ID",
    required: 2 * 60 * 60 * 1000,
  },
  {
    name: "IA",
    roleId: "IA_ROLE_ID",
    required: 60 * 60 * 1000,
  },
];

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

  async execute(message) {
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

      const missing = rank.required - totalTime;

      const existing = db
        .prepare(
          `
                SELECT *
                FROM infractions
                WHERE user_id = ?
                AND infraction_type = ?
            `,
        )
        .get(member.id, "Inactivity");

      const infractionId = genId();

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
        existing ? existing.total_infractions + 1 : 1,
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

**Missing**
${formatTime(missing)}

**Infraction ID**
${infractionId}

Please complete your required activity time.`,
        )
        .setColor(0xff0000)
        .setTimestamp();

      await member
        .send({
          embeds: [embed],
        })
        .catch(() => {});

      infractions.push(
        `<@${member.id}> - ${rank.name} - ${formatTime(totalTime)}`,
      );
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle("Inactivity Check Complete")
      .setDescription(
        infractions.length ? infractions.join("\n") : "No infractions issued.",
      )
      .setColor(0xff0000)
      .setTimestamp();

    return message.channel.send({
      embeds: [resultEmbed],
    });
  },
};
