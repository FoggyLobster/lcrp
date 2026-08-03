const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("Missing API_KEY in .env");
}

const ERLC_API = "https://api.policeroleplay.community/v1";

const erlc = axios.create({
  baseURL: ERLC_API,
  headers: {
    Authorization: API_KEY,
  },
  timeout: 10000,
});

async function getPlayers() {
  try {
    const response = await erlc.get("/server/players");

    return response.data || [];
  } catch (error) {
    console.error(
      "Failed to get ERLC players:",
      error.response?.data || error.message,
    );

    return [];
  }
}

async function getTotalPlayers() {
  const players = await getPlayers();

  return Array.isArray(players) ? players.length : players.players?.length || 0;
}

async function isOnline() {
  const total = await getTotalPlayers();

  return total > 0;
}

async function getPlayerNames() {
  const players = await getPlayers();

  if (!Array.isArray(players)) {
    return [];
  }

  return players.map((player) => player.Player);
}

module.exports = {
  getPlayers,
  getTotalPlayers,
  isOnline,
  getPlayerNames,
};
