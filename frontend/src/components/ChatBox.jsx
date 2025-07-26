const ChatBox = ({ messages, loading, chatInput, onInputChange, onSend }) => (
  <div className="flex flex-col gap-6">
    <div className="h-80 overflow-y-auto bg-white rounded-xl border border-amber-200 p-4 flex flex-col gap-4 shadow-inner" style={{ minHeight: 320 }}>
      {messages.length === 0 && (
        <div className="text-amber-400 text-center mt-16 select-none">Start chatting about your PDF!</div>
      )}
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm whitespace-pre-line ${msg.role === "user" ? "bg-amber-500 text-white" : "bg-amber-200 text-amber-900"}`}>
            {msg.text}
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="max-w-xs px-4 py-2 rounded-2xl shadow bg-amber-200 text-amber-900 animate-pulse">
            AI is thinking...
          </div>
        </div>
      )}
    </div>
    <form onSubmit={onSend} className="flex gap-2 mt-2">
      <input
        type="text"
        className="flex-1 px-4 py-3 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-amber-900 bg-white shadow"
        placeholder="Ask something about your PDF..."
        value={chatInput}
        onChange={e => onInputChange(e.target.value)}
        disabled={loading}
        autoFocus
      />
      <button
        type="submit"
        className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading || !chatInput.trim()}
      >
        Send
      </button>
    </form>
  </div>
);

export default ChatBox; 