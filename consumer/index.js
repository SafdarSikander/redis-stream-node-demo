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

const processMessage = (message) => {
  console.log("message" + message);
  const [key, [label, value]] = message;

  const decodedMessage = msgpack.decode(value);
  console.log(
    `Received message at ${decodedMessage.time}: ${decodedMessage.msg}`
  );
};

const consumeMessages = async () => {
  let lastId = "0"; // Starting point for the stream

  while (true) {
    try {
      let response = await client.xRead(
        redis.commandOptions({
          isolated: true,
          returnBuffers: true,
        }),
        [
          // XREAD can read from multiple streams, starting at a
          // different ID for each...
          {
            key: "mystream",
            id: lastId,
          },
        ],
        {
          // Read 1 entry at a time, block for 5 seconds if there are none.
          COUNT: 1,
          BLOCK: 0,
        }
      );
      if (response) {
        // Response is an array of streams, each containing an array of
        // entries:
        // [
        //   {
        //     "name": "mystream",
        //     "messages": [
        //       {
        //         "id": "1642088708425-0",
        //         "message": {
        //           "num": "999"
        //         }
        //       }
        //     ]
        //   }
        // ]
        // console.log(JSON.stringify(response));

        // Get the ID of the first (only) entry returned.
        lastId = response[0].messages[0].id;
        const msg = response[0].messages[0].message.message;
        console.log(msgpack.decode(msg));
        // console.log(lastId);
      } else {
        // Response is null, we have read everything that is
        // in the stream right now...
        console.log("No new stream entries.");
      }
    } catch (err) {
      console.error("Error reading from stream:", err);
      process.exit(1);
    }
  }
};

consumeMessages();
