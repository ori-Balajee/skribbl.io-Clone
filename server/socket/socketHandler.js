const rooms = require("../rooms");
const generateRoomCode = require("../utils/generateRoomCode");
const getRandomWords = require("../utils/getRandomWords");

function socketHandler(io) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);


    });
}

module.exports = socketHandler;