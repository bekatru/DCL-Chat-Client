require("dotenv").config();
const fs = require("fs");
const WebSocketClient = require("websocket").client;
const client = new WebSocketClient();

function logMessage(message) {
  const LogfileName = `${new Date().toDateString()}.json`;
  try {
    if (fs.existsSync(LogfileName)) {
      fs.readFile(LogfileName, "utf8", function readFileCallback(err, data) {
        if (err) {
          console.log(err);
        } else {
          const log = JSON.parse(data);
          log.messages.push(JSON.parse(message.utf8Data));
          const json = JSON.stringify(log, null, 2);
          fs.writeFile(LogfileName, json, "utf8", () => {});
        }
      });
    } else {
      fs.writeFile(
        LogfileName,
        JSON.stringify({
          messages: [JSON.parse(message.utf8Data)],
        }),
        () => console.log("New Log File Created")
      );
    }
  } catch (err) {
    console.error(err);
  }
}

client.on("connectFailed", function (error) {
  console.log("Connect Error: " + error.toString());
});

client.on("connect", function (connection) {
  console.log("WebSocket Client Connected");

  connection.on("error", function (error) {
    console.log("Connection Error: " + error.toString());
  });

  connection.on("close", function () {
    console.log("Connection Closed");
  });

  connection.on("message", function (message) {
    logMessage(message);
  });
});

client.connect(
  `wss://us-nyc-1.websocket.me/v3/${process.env.CHAT_ROOM}?api_key=${process.env.CHAT_WS_API}`
);
