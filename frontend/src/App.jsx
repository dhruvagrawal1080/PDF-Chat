import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import PdfUpload from "./components/PdfUpload";
import ChatBox from "./components/ChatBox";
import PdfHeader from "./components/PdfHeader";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const fileInputRef = useRef();

  // Cleanup session on tab close
  useEffect(() => {
    return () => {
      if (sessionId) {
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/cleanup`, { sessionId });
      }
    };
  }, [sessionId]);

  const handleFileChange = (e) => {
    setError("");
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfName(file.name);
    } else {
      setError("Please select a valid PDF file.");
      setPdfFile(null);
      setPdfName("");
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setPdfName("");
    setSessionId(null);
    setIsFileUploaded(false);
    setMessages([]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/upload`, formData);
      setSessionId(res.data.sessionId);
      setIsFileUploaded(true); // Go directly to chat after upload/indexing
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages((msgs) => [...msgs, { role: "user", text: chatInput }]);
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/ask`, { sessionId, query: chatInput });
      setMessages((msgs) => [...msgs, { role: "ai", text: res.data.response }]);
      setChatInput("");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Chat failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-gradient-to-br from-blue-200/80 via-blue-300/70 to-blue-500/60 backdrop-blur-lg rounded-3xl shadow-2xl p-8 flex flex-col gap-8">
        <h1 className="text-3xl font-extrabold text-center text-amber-700 tracking-tight mb-2">
          PDFChat <span className="text-amber-500">AI</span>
        </h1>
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-2 text-center text-sm font-medium">
            {error}
          </div>
        )}
        {!isFileUploaded && (
          <PdfUpload
            pdfName={pdfName}
            pdfFile={pdfFile}
            loading={loading}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onRemovePdf={handleRemovePdf}
            onUpload={handleUpload}
          />
        )}
        {isFileUploaded && (
          <>
            <PdfHeader pdfName={pdfName} onRemovePdf={handleRemovePdf} />
            <ChatBox
              messages={messages}
              loading={loading}
              chatInput={chatInput}
              onInputChange={setChatInput}
              onSend={handleChat}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
