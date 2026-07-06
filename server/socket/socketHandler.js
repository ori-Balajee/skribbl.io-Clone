const rooms = require("../rooms");
const generateRoomCode = require("../utils/generateRoomCode");
const getRandomWords = require("../utils/getRandomWords");

function socketHandler(io) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("create_room", ({ hostName, settings }) => {
            if (!hostName) return;

            const roomId = generateRoomCode();

            const hostPlayer = {
                id: socket.id,
                playerName: hostName,
                isHost: true,
                score: 0,
                hasGuessedCorrectly: false
            };

            rooms[roomId] = {
                id: roomId,
                settings: {
                    maxPlayers: settings?.maxPlayers || 8,
                    rounds: settings?.rounds || 3,
                    drawTime: settings?.drawTime || 60,
                },
                players: [hostPlayer],

                currentRound: 0,
                drawerIndex: 0,
                currentWord: "",
                timer: 0,
                timerId: null,

                wordOptionsSaved: [],
                currentDrawerIdSaved: null
            };

            socket.join(roomId);

            io.to(roomId).emit("player_joined", {
                roomId: roomId,
                player: hostPlayer,
                players: rooms[roomId].players
            });

            console.log(`Room ${roomId} created successfully by host: ${hostName}`);
        });

        socket.on("join_room", ({ roomId, playerName }) => {
            const targetRoomId = roomId?.toUpperCase();
            const room = rooms[targetRoomId];

            if (!room) {
                console.log("oops");
                return;
            }

            // Is the room full?
            if (room.players.length >= room.settings.maxPlayers) {
                socket.emit("error_message", "Room is full.");
                return;
            }

            const guestPlayer = {
                id: socket.id,
                playerName: playerName,
                isHost: false,
                score: 0,
                hasGuessedCorrectly: false
            };

            // Add to the room's list of players
            room.players.push(guestPlayer);

            socket.join(targetRoomId);

            const payload = {
                roomId: targetRoomId,
                player: guestPlayer,
                players: room.players
            };

            // Direct emit to the joiner and broadcast to the rest
            socket.emit("player_joined", payload);
            socket.to(targetRoomId).emit("player_joined", payload);

            console.log(`Player ${playerName} successfully joined room: ${targetRoomId}`);
        });

        socket.on("disconnect", () => {
            for (const roomId in rooms) {
                const room = rooms[roomId];
                const playerIndex = room.players.findIndex(p => p.id === socket.id);

                if (playerIndex !== -1) {
                    // Remove player from the array
                    room.players.splice(playerIndex, 1);

                    io.to(roomId).emit("player_left", {
                        playerId: socket.id,
                        players: room.players
                    });

                    const totalGuessers = room.players.filter(p => p.id !== room.currentDrawerIdSaved).length;
                    const completedGuesses = room.players.filter(p => p.hasGuessedCorrectly).length;
                    if (totalGuessers > 0 && completedGuesses >= totalGuessers) {
                        endTurn(io, roomId, "Everyone guessed it!");
                    }

                    if (room.players.length === 0) {
                        delete rooms[roomId];
                    }
                    break;
                }
            }
        });

        socket.on("start_game", ({ roomId }) => {

            const targetRoomId = roomId?.toUpperCase();
            const room = rooms[targetRoomId];

            if (!room) return;

            room.currentRound = 1;
            room.drawerIndex = 0;

            const requestingPlayer = room.players.find(p => p.id === socket.id);
            if (!requestingPlayer || !requestingPlayer.isHost) {
                socket.emit("error_message", "Only the host can start the game.");
                return;
            }

            room.players.forEach(p => p.hasGuessedCorrectly = false);

            io.to(targetRoomId).emit("game_started", { players: room.players });

            setTimeout(() => {
                startNewTurn(io, targetRoomId);
            }, 1000);

            console.log(`Game successfully started in room: ${targetRoomId}`);
        });

        socket.on("word_chosen", ({ roomId, word }) => {
            const targetRoomId = roomId?.toUpperCase();
            const room = rooms[targetRoomId];

            if (!room) return;

            room.currentWord = word;
            room.timer = room.settings.drawTime;

            io.to(targetRoomId).emit("round_start_drawing", {
                word: word,
                drawerId: room.currentDrawerIdSaved
            });

            runTurnTimer(io, targetRoomId);

            console.log(`Word "${word}" chosen in room ${targetRoomId}. Timer started.`);
        });

        socket.on("drawing_data", ({ roomId, from, to, color, lineWidth }) => {
            const targetRoomId = roomId?.toUpperCase();

            socket.to(targetRoomId).emit("draw_stroke", { from, to, color, lineWidth });
            console.log("drawing")
        });

        socket.on("clear_drawing", ({ roomId }) => {
            const targetRoomId = roomId?.toUpperCase();
            socket.to(targetRoomId).emit("clear_canvas");
            console.log("clear the board")
        });

        socket.on("send_message", ({ roomId, text }) => {
            const targetRoomId = roomId?.toUpperCase();
            const room = rooms[targetRoomId];
            if (!room) return;

            const senderPlayer = room.players.find(p => p.id === socket.id);
            if (!senderPlayer) return;

            const cleanInput = text.trim().toLowerCase();
            const cleanSecretWord = room.currentWord?.trim().toLowerCase();

            if (cleanSecretWord && cleanInput === cleanSecretWord && senderPlayer.id !== room.currentDrawerIdSaved) {

                if (!senderPlayer.hasGuessedCorrectly) {
                    senderPlayer.hasGuessedCorrectly = true;

                    senderPlayer.score += 100;

                    io.to(targetRoomId).emit("receive_message", {
                        id: Math.random().toString(36).substring(2, 9),
                        sender: "System",
                        text: `${senderPlayer.playerName} guessed the word! 🎉`,
                        system: true,
                        correctGuess: true
                    });

                    io.to(targetRoomId).emit("player_joined", { players: room.players });

                    const totalGuessers = room.players.filter(p => p.id !== room.currentDrawerIdSaved).length;
                    const completedGuesses = room.players.filter(p => p.hasGuessedCorrectly).length;

                    if (completedGuesses >= totalGuessers && totalGuessers > 0) {
                        endTurn(io, targetRoomId, "Everyone guessed the word! 🎉");
                    }
                }

            } else {
                io.to(targetRoomId).emit("receive_message", {
                    id: Math.random().toString(36).substring(2, 9),
                    sender: senderPlayer.playerName,
                    text: text,
                    system: false,
                    correctGuess: false
                });
            }
        });
    });
}

function startNewTurn(io, roomId) {
    const room = rooms[roomId];
    if (!room || room.players.length === 0) return;

    const currentDrawer = room.players[room.drawerIndex];
    if (!currentDrawer) return;

    const wordOptions = getRandomWords();
    room.wordOptionsSaved = wordOptions;
    room.currentDrawerIdSaved = currentDrawer.id;

    room.players.forEach((player) => {
        player.hasGuessedCorrectly = false;
        const isCurrentDrawer = player.id === currentDrawer.id;

        io.to(player.id).emit("round_start", {
            drawerId: currentDrawer.id,
            drawerName: currentDrawer.playerName,
            round: room.currentRound,
            drawTime: room.settings.drawTime,
            wordOptions: isCurrentDrawer ? wordOptions : null
        });
    });

    io.to(roomId).emit("receive_message", {
        id: Math.random().toString(36).substring(2, 9),
        sender: "System",
        text: `${currentDrawer.playerName} is choosing a word...`,
        system: true
    });
}

function runTurnTimer(io, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    clearInterval(room.timerId);

    room.timerId = setInterval(() => {
        if (!rooms[roomId]) {
            clearInterval(room.timerId);
            return;
        }

        room.timer--;
        io.to(roomId).emit("timer_tick", room.timer);

        if (room.timer <= 0) {
            clearInterval(room.timerId);
            endTurn(io, roomId, "Time's up!");
        }
    }, 1000);
}

function endTurn(io, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    clearInterval(room.timerId);
    room.drawerIndex++;

    let nextDrawerIndex = room.drawerIndex;
    let nextRound = room.currentRound;

    if (nextDrawerIndex >= room.players.length) {
        nextDrawerIndex = 0;
        nextRound++;
    }

    const nextDrawer = room.players[nextDrawerIndex] || null;

    io.to(roomId).emit("round_end", {
        word: room.currentWord,
        scores: room.players.map(p => ({ id: p.id, playerName: p.playerName, score: p.score })),
        nextDrawer: nextDrawer ? nextDrawer.playerName : null
    });

    room.drawerIndex = nextDrawerIndex;
    room.currentRound = nextRound;

    if (room.currentRound > room.settings.rounds) {
        io.to(roomId).emit("game_over", {
            winner: room.players.reduce((max, p) => p.score > max.score ? p : max, room.players[0]),
            leaderboard: room.players.sort((a, b) => b.score - a.score)
        });
        return;
    }

    setTimeout(() => {
        startNewTurn(io, roomId);
    }, 4000);
}
module.exports = socketHandler;