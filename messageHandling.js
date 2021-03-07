const fs = require("fs");
const util = require("util");

const n = 5; //Number of last messages
const m = 15; //Number of minutes
const onlineUsers = [];

const handleConnection = (data, room, callback) => {
  const { type, message, name, id } = JSON.parse(data);
  switch (type + "_" + message) {
    case "connection_joined":
      onlineUsers.push({ id, name });
      getRecentMessages(room, n, m).then((data) => {
        if (data) {
          callback(
            JSON.stringify({
              id: "service",
              type,
              onlineUsers,
              messages: data,
              adress: id,
            })
          );
        }
      });
      break;
    case "connection_left":
      const i = onlineUsers.findIndex((user) => user.id === id);
      onlineUsers.splice(i, 1);
      callback(
        JSON.stringify({
          id: "service",
          type,
          onlineUsers,
        })
      );
      break;
    default:
      logMessage(room, JSON.parse(data));
  }
};

// Get Recent Messages
const getRecentMessages = (room, number, minutes) => {
  return getLogMessages(room)
    .then((data) => JSON.parse(data))
    .then(({ messages }) => {
      const last = messages.slice(Math.max(messages.length - number, 1));
      const recent = last.filter(
        ({ date }) =>
          new Date(date).getTime() > new Date().getTime() - minutes * 60000
      );
      return recent;
    })
    .catch((err) => console.error(err));
};

//Log Message
const logMessage = (room, message) => {
  getLogMessages(room)
    .then((data) => JSON.parse(data))
    .then(({ info, messages }) => {
      fs.writeFile(
        genFilePath(room),
        JSON.stringify(
          {
            info,
            messages: [...messages, message],
          },
          null,
          2
        ),
        (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log("Message Logged");
          }
        }
      );
    })
    .catch((error) => {
      switch (error.code) {
        case "ENOENT":
          console.log(
            "!!!Error!!!\ngetLastMessages()\nFile doesn't exist\n" + file
          );
          createLogFile(room);
          break;
        default:
          console.error(error);
      }
    });
};

//Get Log Messages
const getLogMessages = (room) => {
  const read = util.promisify(fs.readFile);
  const file = genFilePath(room);
  return read(file, "utf8");
};

//Create Log File
const createLogFile = (room) => {
  fs.writeFile(
    genFilePath(room),
    JSON.stringify(
      {
        info: { room, created: new Date() },
        messages: [],
      },
      null,
      2
    ),
    () => console.log("New Log File Created")
  );
};

//Generate File Path
const genFilePath = (room) => {
  const date = new Date()
    .toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
    .split("/")
    .join("-");
  return `../chatlogs/${room}/${room}_${date}.json`;
};

exports.genFilePath = genFilePath;
exports.handleConnection = handleConnection;
