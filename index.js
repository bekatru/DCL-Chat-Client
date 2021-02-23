const Client = (room) => {
  require("dotenv").config();
  const fs = require("fs");
  const WebSocketClient = require("websocket").client;

  const {
    ROOM_ROOT,
    ROOM_SURREAL,
    ROOM_MEHAKJAIN,
    ROOM_HPRIVAKOS,
  } = process.env;

  const channel = {
    id: room,
    path:
      room === ROOM_ROOT
        ? "root"
        : room === ROOM_SURREAL
        ? "surreal"
        : room === ROOM_MEHAKJAIN
        ? "mehakjain"
        : room === ROOM_HPRIVAKOS
        ? "hprivakos"
        : "other",
  };

  function setFilePath() {
    const today = new Date();
    const date = today
      .toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
      .split("/")
      .join("-");
    return `../chatlogs/${channel.path}/${channel.path}_${date}.json`;
  }

  function logMessage(message) {
    const LogfileName = setFilePath();
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
          JSON.stringify(
            {
              info: { room: channel.path, created: new Date() },
              messages: [JSON.parse(message.utf8Data)],
            },
            null,
            2
          ),
          () => console.log("New Log File Created")
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleConnect({ name, message }) {
    console.log({ name, message });
  }

  const client = new WebSocketClient();

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
      const data = JSON.parse(message.utf8Data);
      if (data.message === "") return;
      if (
        data.message === "joined the chat" ||
        data.message === "left the chat"
      ) {
        connection.send(
          JSON.stringify({
            id: "service",
            type: "online",
            name: data.name,
            message: data.message,
          })
        );
      } else {
        logMessage(message);
      }
    });
  });

  client.connect(
    `wss://us-nyc-1.websocket.me/v3/${room}?api_key=${process.env.BEKA_PS_API}`
  );
};

exports.Client = Client;
