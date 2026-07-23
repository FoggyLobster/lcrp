const { EmbedBuilder } = require("discord.js");

const db = require("../db");

function genShiftId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";

  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
}

function formatTime(ms) {
  if (!ms || ms <= 0) return "0s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const s = seconds % 60;
  const m = minutes % 60;

  let result = "";

  if (hours > 0) result += `${hours}hr `;
  if (m > 0) result += `${m}m `;
  if (s > 0) result += `${s}s`;

  return result.trim();
}

module.exports = {
  customId: "shift_admin_actions",

  async execute(interaction) {
    const [, userId] = interaction.customId.split(":");

    const member = await interaction.guild.members
      .fetch(userId)
      .catch(() => null);

    if (!member) {
      return interaction.reply({
        content: "User not found.",
        ephemeral: true,
      });
    }

    const selected = interaction.values[0];

    if (selected === "start") {
      const active = db
        .prepare(
          `
        SELECT *
        FROM shifts
        WHERE user_id = ?
        AND status = 'online'
      `,
        )
        .get(userId);

      if (active) {
        return interaction.reply({
          content: "User is already on shift.",
          ephemeral: true,
        });
      }

      const wave = db
        .prepare(
          `
        SELECT *
        FROM shift_wave
        WHERE status = 'active'
        ORDER BY id DESC
        LIMIT 1
      `,
        )
        .get();

      const shiftId = genShiftId();

      db.prepare(
        `
        INSERT INTO shifts
        (
          shift_id,
          wave_id,
          user_id,
          status,
          started_at,
          total_time,
          total_shifts
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        shiftId,
        wave ? wave.wave_id : "None",
        userId,
        "online",
        Date.now(),
        0,
        1,
      );

      return interaction.reply({
        content: `<@${userId}>'s shift has been started successfully.`,
        ephemeral: true,
      });
    }

    if (selected === "break") {
      const active = db
        .prepare(
          `
        SELECT *
        FROM shifts
        WHERE user_id = ?
        AND status = 'online'
        ORDER BY id DESC
        LIMIT 1
      `,
        )
        .get(userId);

      if (!active) {
        return interaction.reply({
          content: "User is not on shift.",
          ephemeral: true,
        });
      }

      db.prepare(
        `
        INSERT INTO shifts_breaks
        (
          shift_id,
          user_id,
          started_at
        )
        VALUES (?, ?, ?)
      `,
      ).run(active.shift_id, userId, Date.now());

      return interaction.reply({
        content: `<@${userId}> has been placed on break.`,
        ephemeral: true,
      });
    }

    if (selected === "end") {
      const active = db
        .prepare(
          `
        SELECT *
        FROM shifts
        WHERE user_id = ?
        AND status = 'online'
        ORDER BY id DESC
        LIMIT 1
      `,
        )
        .get(userId);

      if (!active) {
        return interaction.reply({
          content: "User is not on shift.",
          ephemeral: true,
        });
      }

      const totalTime = Date.now() - active.started_at;

      db.prepare(
        `
        UPDATE shifts
        SET
          status = 'offline',
          ended_at = ?,
          total_time = ?
        WHERE shift_id = ?
      `,
      ).run(Date.now(), totalTime, active.shift_id);

      return interaction.reply({
        content: `<@${userId}>'s shift has been ended successfully.`,
        ephemeral: true,
      });
    }

    if (selected === "view_shifts") {
      const shifts = db
        .prepare(
          `
        SELECT *
        FROM shifts
        WHERE user_id = ?
        ORDER BY id DESC
      `,
        )
        .all(userId);

      const list = shifts
        .map((shift, index) => {
          return (
            `${index + 1}. Shift ID: ${shift.shift_id}\n` +
            `Time: ${formatTime(shift.total_time)}\n` +
            `Status: ${shift.status}`
          );
        })
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setTitle("Shift History")
        .setDescription(list || "No shift data found.");

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  },
};
