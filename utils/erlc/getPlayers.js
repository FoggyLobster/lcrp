const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.log("No API key found. Please set the API_KEY environment variable.");
}

const ERLC_API_URL = "https://api.erlc.gg/v1/server/players";

const api = axios.create({
  baseURL: ERLC_API_URL,
  headers: {
    Authorization: API_KEY,
  },
  timeout: 10000,
});

module.exports = {
  async getPlayers() {
    try {
      const response = await api.get("/server/players");

      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async getPlayerCount() {
    try {
      const players = await this.getPlayers();
      return {
        online: players.length,
        players,
      };
    } catch (error) {
      console.error(error);

      return {
        online: 0,
        players: [],
      };
    }
  },

  async isOnline() {
    const data = await this.getPlayerCount();
    return data.online > 0;
  },

  async getPlayerNames() {
    const data = await this.getPlayerCount();
    return data.players.map((player) => player.Player);
  },
};
