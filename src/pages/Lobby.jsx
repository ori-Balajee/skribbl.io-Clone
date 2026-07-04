import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "../socket/socket";


function Lobby() {
  const [wordChoices, setWordChoices] = useState([]);

  useEffect(() => {
    socket.on("choose-word", (words) => {
      setWordChoices(words);
    });

    return () => {
      socket.off("choose-word");
    };

  }, [])

  const selectWord = (word) => {

    socket.emit("word-selected", {
      roomId: room.id,
      word
    });

    setWordChoices([]);
  };

  const location = useLocation();
  const room = location.state;



  return (
    <div className="p-8">

      <h1 className="text-4xl font-bold mb-4">
        Lobby
      </h1>

      <h2 className="mb-6">
        Room: {room?.id}
      </h2>

      <div className="space-y-3">

        {room?.players?.map(
          (player) => (
            <div
              key={player.id}
              className="bg-white shadow p-4 rounded"
            >
              {player.username}
            </div>
          )
        )}
      </div>

      {wordChoices.length > 0 && (
        <div className="mt-6">

          <h2>
            Choose a word
          </h2>

          <div className="flex gap-4 mt-3">

            {wordChoices.map( word => (
                <button
                  key={word}
                  onClick={() => selectWord(word)}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {word}
                </button>
              )
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default Lobby;