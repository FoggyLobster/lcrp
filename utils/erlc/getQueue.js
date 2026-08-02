require("dotenv").config();

async function getQueue() {
  const options = {
    method: "GET",
    headers: {
      "server-key": process.env.API_KEY,
    },
  };

  try {
    const res = await fetch("https://api.erlc.gg/v1/server/queue", options);
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getTotalQueue() {
  const queue = await getQueue();

  if (!queue) return 0;

  return queue.total;
}

module.exports = {
  getQueue,
  getTotalQueue,
};
