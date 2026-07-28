import { useEffect, useRef, useState } from "react";
import { FaImage, FaPaperPlane, FaPlus, FaRegCommentDots } from "react-icons/fa";
import "./ChatTool.css";

function MNGChatTool() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("gpt-5.4");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");

  const formatModelLabel = (model) =>
    model
      .split("-")
      .map((part) => (part === "gpt" ? part.toUpperCase() : part))
      .join("-");

  const normalizeMessage = (msg) => ({
    id: msg.id ?? null,
    role: msg.role === "assistant" ? "bot" : msg.role,
    text: msg.content ?? "",
    messageType: msg.messageType || "TEXT",
    fileName: msg.fileName ?? "",
    fileUrl: msg.fileUrl ?? "",
  });

  const createSessionOnServer = async () => {
    const res = await fetch(`${API_URL}/chat/session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCurrentSessionId(data.sessionId);
    setMessages([]);
    await loadSessions();
    return data.sessionId;
  };

  const ensureSession = async () => {
    if (currentSessionId) {
      return currentSessionId;
    }

    return createSessionOnServer();
  };

  const loadSessions = async () => {
    const res = await fetch(`${API_URL}/chat/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSessions(data);
  };

  const loadModels = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/models`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setModels(data);
        setSelectedModel((prev) => (data.includes(prev) ? prev : data[0]));
      }
    } catch (error) {
      setModels(["gpt-5.4", "gpt-5.4-mini"]);
    }
  };

  const loadHistory = async (sessionId) => {
    setCurrentSessionId(sessionId);
    const res = await fetch(`${API_URL}/chat/history?sessionId=${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const lastModel = [...data].reverse().find((msg) => msg.model)?.model;

    if (lastModel) {
      setSelectedModel(lastModel);
    }

    setMessages(data.map(normalizeMessage));
  };

  const createNewChat = async () => {
    await createSessionOnServer();
  };

  const saveTitle = async (sessionId) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    await fetch(`${API_URL}/chat/session/${sessionId}/title`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: editingTitle }),
    });

    setEditingSessionId(null);
    loadSessions();
  };

  const deleteSession = async (sessionId) => {
    const targetSession = sessions.find((session) => session.sessionId === sessionId);
    const sessionTitle = targetSession?.title || "New Chat";
    const shouldDelete = window.confirm(`Delete conversation "${sessionTitle}"?`);

    if (!shouldDelete) return;

    setDeletingSessionId(sessionId);

    try {
      const response = await fetch(`${API_URL}/chat/session/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      setSessions((prev) => prev.filter((session) => session.sessionId !== sessionId));

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      window.alert("Unable to delete this conversation right now.");
    } finally {
      setDeletingSessionId(null);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return;

    setIsUploadingImage(true);

    try {
      const sessionId = await ensureSession();
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/chat/session/${sessionId}/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, normalizeMessage(data)]);
      await loadSessions();
    } catch (error) {
      window.alert("Unable to upload this image right now.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const sessionId = await ensureSession();
    const userMessage = { role: "user", text: input, messageType: "TEXT" };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (data.model) {
        setSelectedModel(data.model);
      }

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply, messageType: "TEXT" },
      ]);
      loadSessions();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error: Unable to connect to the server.", messageType: "TEXT" },
      ]);
    }
  };

  useEffect(() => {
    loadSessions();
    loadModels();
  }, []);

  return (
    <div className="chat-container">
      <aside className="sidebar">
        <button className="new-chat-btn" onClick={createNewChat}>
          <FaPlus /> New Chat
        </button>

        <div className="history-list">
          <p className="history-title">Recent History</p>

          {sessions.map((s) => (
            <div
              key={s.sessionId}
              className={`history-item ${currentSessionId === s.sessionId ? "active" : ""}`}
              onClick={() => loadHistory(s.sessionId)}
            >
              <div className="history-item-content">
                <FaRegCommentDots className="history-item-icon" />

                {editingSessionId === s.sessionId ? (
                  <input
                    className="title-edit-input"
                    value={editingTitle}
                    autoFocus
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => saveTitle(s.sessionId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle(s.sessionId);
                      if (e.key === "Escape") setEditingSessionId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="history-item-title"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(s.sessionId);
                      setEditingTitle(s.title || "New Chat");
                    }}
                  >
                    {s.title || "New Chat"}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="delete-session-btn"
                aria-label={`Delete ${s.title || "New Chat"}`}
                title="Delete conversation"
                disabled={deletingSessionId === s.sessionId}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(s.sessionId);
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="main-chat">
        <header className="chat-header">
          <h3>MNG Chat Tool</h3>
          <div className="model-picker">
            <label htmlFor="model-select">Model</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {formatModelLabel(model)}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="messages-wrapper">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h1>How can I help you today?</h1>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={msg.id ?? index} className={`message-row ${msg.role}`}>
                <div className="avatar">{msg.role === "user" ? "U" : "AI"}</div>
                <div className="message-content">
                  <div className="role-label">
                    {msg.role === "user" ? "You" : "Bot"}
                  </div>

                  {msg.messageType === "IMAGE" ? (
                    <div className="image-message-card">
                      <img
                        className="chat-image-preview"
                        src={msg.fileUrl}
                        alt={msg.fileName || "Uploaded image"}
                      />
                      <div className="image-message-meta">
                        <span>{msg.fileName || "image"}</span>
                        <a href={msg.fileUrl} download={msg.fileName || ""} target="_blank" rel="noreferrer">
                          Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text">{msg.text}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="input-area">
          <div className="input-container">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="image-upload-input"
              onChange={(e) => uploadImage(e.target.files?.[0])}
            />
            <button
              type="button"
              className="image-upload-btn"
              title="Upload image"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
            >
              <FaImage />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                isUploadingImage
                  ? "Uploading image..."
                  : `Message MNG Chat with ${formatModelLabel(selectedModel)}...`
              }
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isUploadingImage}
            >
              <FaPaperPlane />
            </button>
          </div>
          <p className="disclaimer">
            AI can make mistakes. Check important info.
          </p>
        </div>
      </main>
    </div>
  );
}

export default MNGChatTool;
