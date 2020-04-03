const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatBot";

// Run when a client connects
io.on("connection", socket => {
  // console.log('New WS Connection...')

  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    //emits a Welcome to the current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

    // Broadcast when a user connects
    //emits to everyone but the current urser
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
      })
  });

  // Listen for chatMessage
  socket.on("chatMessage", msg => {
    // console.log(msg)

    const user = getCurrentUser(socket.id);
    // console.log(user)

    // Emit message to everyone
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if(user) {
      // Lets EVERYONE know
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
    })
    }
  });
});

const PORT = 888 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
