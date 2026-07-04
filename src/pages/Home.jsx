import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const createRoom = () => {
    navigate("/lobby/temp123");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-6">
      
      <h1 className="text-5xl font-bold">
        Skribbl Clone
      </h1>

      <button
        onClick={createRoom}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Create Room
      </button>

    </div>
  );
}

export default Home;