const rooms = require("../rooms");
const generateRoomCode = require("../utils/generateRoomCode");

function socketHandler(io) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("create-room", (username) => {
            const roomId = generateRoomCode();

            rooms[roomId] = {
                id: roomId,
                host: socket.id,
                players: [
                    {
                        id: socket.id,
                        username
                    }
                ]
            };

            socket.join(roomId);

            socket.emit(
                "room-created",
                rooms[roomId]
            );

            console.log("Room created:", roomId);
        });

        socket.on("join-room", ({ roomId, username }) => {
            const room = rooms[roomId];

            if (!room) {
                socket.emit(
                    "error-message",
                    "Room not found"
                );
                return;
            }

            room.players.push({
                id: socket.id,
                username
            });

            socket.join(roomId);

            io.to(roomId).emit(
                "room-updated",
                room
            );

            console.log(
                `${username} joined ${roomId}`
            );
        });

        socket.on("disconnect", () => {
            console.log(
                "Disconnected:",
                socket.id
            );

            for (const roomId in rooms) {
                const room = rooms[roomId];

                room.players = room.players.filter(
                    player => player.id !== socket.id
                );

                io.to(roomId).emit(
                    "room-updated",
                    room
                );

                if (room.players.length === 0) {
                    delete rooms[roomId];
                }
            }
        });
    });
}

module.exports = socketHandler;