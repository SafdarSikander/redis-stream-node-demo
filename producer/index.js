const redis = require("redis");
const msgpack = require("msgpack-lite");
const client = redis.createClient({
  socket: {
    host: "redis",
    port: 6379,
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));
client.connect();
setInterval(async () => {
  const message = { time: Date.now(), msg: "Hello from producer" };
  const packedMessage = msgpack.encode(message);

  const messageId = await client.xAdd(
    "mystream",
    "*",
    {
      message: packedMessage,
      // Other name/value pairs can go here as required...
    },
    {
      TRIM: {
        strategy: "MAXLEN", // Trim by length.
        strategyModifier: "~", // Approximate trimming.
        threshold: 1000, // Retain around 1000 entries.
      },
    }
  );
  console.log(`Message sent with ID: ${messageId}`);
}, 3000);
