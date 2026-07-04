import { useParams } from "react-router-dom";

function Lobby() {
  const { roomId } = useParams();

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-4xl mx-auto bg-white rounded-xl p-6 shadow">

        <h1 className="text-3xl font-bold mb-4">
          Lobby
        </h1>

        <p className="text-gray-500">
          Room: {roomId}
        </p>

      </div>

    </div>
  );
}

export default Lobby;