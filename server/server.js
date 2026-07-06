const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());

const socketHandler = require("./socket/socketHandler");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.SOCKET,
        methods: ["GET", "POST"]
    }
});

socketHandler(io);

const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log("Server running on port 3000");
});