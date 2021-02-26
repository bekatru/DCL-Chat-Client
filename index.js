const Client = (room) => {
  const fs = require("fs");
  require("dotenv").config();
  const WebSocketClient = require("websocket").client;
  // Chat Room IDs
  const {
    ROOM_ROOT,
    ROOM_SURREAL,
    ROOM_MEHAKJAIN,
    ROOM_HPRIVAKOS,
  } = process.env;
  // Chat Room Names
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
  // Create Logfile Path
  function setFilePath() {
    const date = new Date()
      .toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
      .split("/")
      .join("-");
    return `../chatlogs/${channel.path}/${channel.path}_${date}.json`;
  }
  // Write Message to Logfile
  function logMessage(message) {
    const path = setFilePath();
    try {
      if (fs.existsSync(path)) {
        fs.readFile(path, "utf8", function readFileCallback(err, data) {
          if (err) {
            console.log(err);
          } else {
            const log = JSON.parse(data);
            log.messages.push(JSON.parse(message.utf8Data));
            const json = JSON.stringify(log, null, 2);
            fs.writeFile(path, json, "utf8", () => {});
          }
        });
      } else {
        fs.writeFile(
          path,
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
      console.log(err);
    }
  }
  // Create Instance of WS
  const client = new WebSocketClient();
  client.on("connectFailed", function (error) {
    console.log("Connect Error: " + error.toString());
  });
  // Handle Connection Open
  client.on("connect", function (connection) {
    console.log("WebSocket Client Connected");
    connection.on("error", function (error) {
      console.log("Connection Error: " + error.toString());
    });
    // Handle Connection Close
    connection.on("close", function () {
      console.log("Connection Closed");
    });
    //Handle Messages
    let users_online = [];
    connection.on("message", function (message) {
      const data = JSON.parse(message.utf8Data);
      if (data.message === "") return;
      if (
        data.message === "joined the chat" ||
        data.message === "left the chat"
      ) {
        if (data.message === "joined the chat") {
          users_online.push(data.name);
        }
        if (data.message === "left the chat") {
          users_online = users_online.filter((user) => user !== data.name);
        }
        connection.send(
          JSON.stringify({
            id: "service",
            type: "online",
            users: users_online,
            name: data.name,
            message: data.message,
          })
        );
      } else {
        logMessage(message);
      }
    });
  });
  // Connect to WS
  client.connect(
    `wss://us-nyc-1.websocket.me/v3/${room}?api_key=${process.env.DOUG_PS_API}`
  );
};

exports.Client = Client;
