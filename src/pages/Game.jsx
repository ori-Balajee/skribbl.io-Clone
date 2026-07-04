import { useParams } from "react-router-dom";

function Game() {
  const { roomId } = useParams();

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-6xl mx-auto bg-white rounded-xl p-6 shadow">

        <h1 className="text-3xl font-bold">
          Game Screen
        </h1>

        <p className="mt-3 text-gray-500">
          Room: {roomId}
        </p>

      </div>

    </div>
  );
}

export default Game;