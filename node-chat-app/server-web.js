const http = require("http");
const fs = require("fs");
const path = require("path");
const socketIo = require("socket.io");

const server = http.createServer((req, res) => {
  fs.readFile(path.join(__dirname, "client-web.html"), (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end("Error loading client-web.html");
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

const io = socketIo(server);
const users = new Map();

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected`);

  socket.emit("init", Array.from(users.entries()));

  socket.on("registerPublicKey", (data) => {
    const { username, publicKey } = data;
    users.set(username, publicKey);
    console.log(`${username} registered with public key.`);
    io.emit("newUser", { username, publicKey });
  });

  socket.on("message", (data) => {
    const { username, message } = data;
    io.emit("message", { username, message });
  });

  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} disconnected`);
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Web UI Server running on http://localhost:${port}`);
});