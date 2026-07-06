import { useState, useEffect, useRef } from "react";
import socket from "../socket/socket";

function Chat({ roomId, amIDrawer }) {
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState("");
    const chatEndRef = useRef(null);

    useEffect(() => {
        // Listen for incoming messages from the server
        function handleIncomingMessage(msg) {
            setMessages((prev) => [...prev, msg]);
        }

        socket.on("receive_message", handleIncomingMessage);

        return () => {
            socket.off("receive_message", handleIncomingMessage);
        };
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessageHandler = (e) => {
        e.preventDefault();
        if (!inputMsg.trim()) return;

        socket.emit("send_message", { roomId, text: inputMsg });
        setInputMsg("");
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col h-96 shadow-md w-full">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2 mb-3">
                Live Chat & Guesses
            </h3>

            <div className="flex-grow overflow-y-auto mb-4 space-y-2 pr-1 max-h-64 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`text-sm p-2 rounded-lg break-words border ${msg.system
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/30 font-medium text-center text-xs"
                                : msg.correctGuess
                                    ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/30 font-bold"
                                    : "bg-slate-900/50 text-slate-200 border-slate-700/30"
                            }`}
                    >
                        {!msg.system && (
                            <span className="font-bold text-indigo-400 mr-1.5">
                                {msg.sender}:
                            </span>
                        )}
                        <span>{msg.text}</span>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessageHandler} className="flex gap-2 mt-auto">
                <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    disabled={amIDrawer} // Blocks the drawer from typing/spoiling clues
                    placeholder={amIDrawer ? "You are the artist! No typing." : "Type your guess here..."}
                    className="flex-grow bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white placeholder-slate-500"
                />
                <button
                    type="submit"
                    disabled={amIDrawer || !inputMsg.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </form>
        </div>
    );
}

export default Chat;