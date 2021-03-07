require("dotenv").config();
const WebSocketClient = require("websocket").client;
const { handleMessage } = require("./messageHandling");

const Client = (room) => {
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
  // Create Instance of WS
  const client = new WebSocketClient();
  //Connection Failed
  client.on("connectFailed", function (error) {
    console.log("Connect Error: " + error.toString());
  });
  // Handle Connection
  client.on("connect", function (connection) {
    console.log("WebSocket Client Connected");
    //Connection Error
    connection.on("error", function (error) {
      console.log("Connection Error: " + error.toString());
    });
    //Connection Close
    connection.on("close", function () {
      console.log("Connection Closed");
    });
    //Connection Message
    connection.on("message", function ({ utf8Data }) {
      const send = (data) => connection.send(data);
      handleMessage(utf8Data, channel.path, send);
    });
  });
  // Connect to WS
  client.connect(
    `wss://us-nyc-1.websocket.me/v3/${room}?api_key=${process.env.DOUG_PS_API}`
  );
};

exports.Client = Client;
