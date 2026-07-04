import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket/socket";

function Home() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(60);

  useEffect(() => {
  
    const handlePlayerJoined = (data) => {
      // If the room data is sent back, we redirect the user to the lobby
      if (data && data.roomId) {
        navigate(`/lobby/${data.roomId}`, { state: data });
      }
    };

    socket.on("player_joined", handlePlayerJoined);

    return () => {
      socket.off("player_joined", handlePlayerJoined);
    };
  }, [navigate]);

  const createRoom = () => {
    if (!username.trim()) return;

    // Send username alongside the custom settings payload
    socket.emit("create-room", {
      username,
      settings: {
        maxPlayers,
        rounds,
        drawTime
      }
    });
  };

  const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) return;

    socket.emit("join-room", {
      roomId: roomId.toUpperCase(),
      username
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-900 text-white p-4">
      <h1 className="text-5xl font-extrabold tracking-wider text-indigo-400">
        Skribbl Clone
      </h1>

      <div className="flex flex-col gap-4 w-80 bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700">
        {/* Profile Identity */}
        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-slate-900 border border-slate-700 p-3 rounded text-center font-medium focus:outline-none focus:border-indigo-500 transition-colors"
        />

        <hr className="border-slate-700 my-1" />

        {/* Configuration Section for Host */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-center">
            Room Settings (Host)
          </h2>

          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-300">Max Players:</label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 p-1.5 rounded text-sm outline-none"
            >
              {[2, 4, 6, 8, 12].map(num => <option key={num} value={num}>{num}</option>)}
            </select>
          </div>

          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-300">Rounds:</label>
            <select
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 p-1.5 rounded text-sm outline-none"
            >
              {[2, 3, 4, 5, 8].map(num => <option key={num} value={num}>{num}</option>)}
            </select>
          </div>

          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-300">Draw Time:</label>
            <select
              value={drawTime}
              onChange={(e) => setDrawTime(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 p-1.5 rounded text-sm outline-none"
            >
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={90}>90s</option>
              <option value={120}>120s</option>
            </select>
          </div>

          <button
            onClick={createRoom}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded shadow transition-colors cursor-pointer"
          >
            Create Room
          </button>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="grow border-t border-slate-700"></div>
          <span className="shrink mx-4 text-slate-500 text-xs uppercase tracking-wider font-bold">OR</span>
          <div className="grow border-t border-slate-700"></div>
        </div>

        {/* Regular Joining Section */}
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="bg-slate-900 border border-slate-700 p-3 rounded text-center uppercase font-semibold tracking-wider focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={joinRoom}
            className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded shadow transition-colors cursor-pointer"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;