const fs = require("fs");
const util = require("util");

const n = 5; //Number of last messages
const m = 15; //Number of minutes
const onlineUsers = [];

const handleMessage = (data, room, callback) => {
  const { type, message, name, id } = JSON.parse(data);
  switch (type + "_" + message) {
    case "connection_joined":
      onlineUsers.push({ id, name });
      getRecentMessages(room, n, m)
        .then((data) => {
          callback(
            JSON.stringify({
              id: "service",
              type,
              onlineUsers,
              messages: data,
              adress: id,
            })
          );
        })
        .then(() => console.log("{+}Connection{+}"))
        .catch((error) => console.error(error));
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
      console.log("{-}Connection{-}");
      break;
    default:
      logMessage(room, JSON.parse(data));
  }
};

// Get Recent Messages
function getRecentMessages(room, number, minutes) {
  return getLogMessages(room)
    .then((data) => {
      return JSON.parse(data);
    })
    .then(({ messages }) => {
      const last = messages.slice(Math.max(messages.length - number, 1));
      const recent = last.filter(
        ({ date }) =>
          new Date(date).getTime() > new Date().getTime() - minutes * 60000
      );
      return recent;
    })
    .catch((err) => console.error(err));
}

//Log Message
function logMessage(room, message) {
  getLogMessages(room)
    .then((data) => {
      const res = JSON.parse(data);
      return res;
    })
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
            console.groupEnd();
            console.groupEnd();
            console.log("[]Message Logged[]");
          }
        }
      );
    })
    .catch((error) => {
      switch (error.code) {
        case "ENOENT":
          console.group("File doesn't exist");
          console.log("\nCreating new file at...\n" + genFilePath(room));
          createLogFile(room, message);
          break;
        default:
          console.error(error);
      }
    });
}

//Get Log Messages
function getLogMessages(room) {
  const read = util.promisify(fs.readFile);
  const file = genFilePath(room);
  return read(file, "utf8");
}

//Create Log File
function createLogFile(room, message) {
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
    (error) => {
      if (error) {
        switch (error.code) {
          case "ENOENT":
            console.log("Folder doesn't exist\nCreating...");
            fs.mkdir("../chatlogs/" + room, (error) => {
              if (error) {
                console.log("Failed");
                console.error(error);
              } else {
                console.log("Done\nRetrying");
                logMessage(room, message);
              }
            });
            break;
          default:
            console.log("Failed");
            console.error(error);
        }
      } else {
        console.log("Done");
        console.log("New Log File Created");
        logMessage(room, message);
      }
    }
  );
}

//Generate File Path
function genFilePath(room) {
  const date = new Date()
    .toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
    .split("/")
    .join("-");
  return `../chatlogs/${room}/${room}_${date}.json`;
}

exports.handleMessage = handleMessage;
