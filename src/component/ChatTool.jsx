import { useEffect, useRef, useState } from "react";
import { FaImage, FaPaperPlane, FaPlus, FaRegCommentDots, FaSlidersH, FaTrash } from "react-icons/fa";
import "./ChatTool.css";

const PRESETS_STORAGE_KEY = "mng-chat-presets";

const defaultPresets = [
  { id: "helpful-assistant", name: "Helpful assistant", systemPrompt: "You are a helpful, clear, and concise assistant.", temperature: 0.7 },
  { id: "creative", name: "Creative", systemPrompt: "You are a creative brainstorming partner. Offer original, practical ideas.", temperature: 1.1 },
  { id: "precise", name: "Precise", systemPrompt: "You are a precise assistant. Be factual, structured, and state uncertainty clearly.", temperature: 0.2 },
];

const getSavedPresets = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(PRESETS_STORAGE_KEY));
    return Array.isArray(saved) ? saved : defaultPresets;
  } catch {
    return defaultPresets;
  }
};

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
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [presets, setPresets] = useState(getSavedPresets);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presetName, setPresetName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
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

  const loadPresets = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/presets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Unable to load presets");

      const data = await response.json();
      if (Array.isArray(data)) {
        setPresets(data);
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      // Keep the last locally cached presets available when the API is unavailable.
    }
  };

  const applyPreset = (presetId) => {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    setSystemPrompt(preset.systemPrompt);
    setTemperature(preset.temperature);
  };

  const savePreset = async () => {
    const name = presetName.trim();
    if (!name) return;

    const presetDraft = {
      name,
      systemPrompt,
      temperature,
    };

    let preset = { id: `${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, ...presetDraft };

    try {
      const response = await fetch(`${API_URL}/chat/presets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(presetDraft),
      });
      if (response.ok) {
        preset = await response.json();
      }
    } catch {
      // The local cache still lets users keep a preset while offline.
    }

    const updatedPresets = [...presets, preset];
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    setSelectedPresetId(preset.id);
    setPresetName("");
  };

  const deletePreset = async () => {
    if (!selectedPresetId) return;

    try {
      await fetch(`${API_URL}/chat/presets/${selectedPresetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Remove locally as well, so the selected preset is no longer offered.
    }

    const updatedPresets = presets.filter((preset) => preset.id !== selectedPresetId);
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    setSelectedPresetId("");
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
          systemPrompt,
          temperature,
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
    loadPresets();
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
          <div className="header-controls">
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
            <button
              type="button"
              className={`settings-toggle ${showSettings ? "active" : ""}`}
              onClick={() => setShowSettings((visible) => !visible)}
              aria-expanded={showSettings}
              aria-controls="chat-settings"
            >
              <FaSlidersH /> Settings
            </button>
          </div>
        </header>

        {showSettings ? (
          <section id="chat-settings" className="chat-settings" aria-label="Chat settings">
            <div className="settings-field preset-field">
              <label htmlFor="preset-select">Presets</label>
              <div className="preset-row">
                <select id="preset-select" value={selectedPresetId} onChange={(e) => applyPreset(e.target.value)}>
                  <option value="">Select a preset</option>
                  {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
                </select>
                <button type="button" className="delete-preset-btn" onClick={deletePreset} disabled={!selectedPresetId} title="Delete selected preset" aria-label="Delete selected preset">
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="settings-field prompt-field">
              <label htmlFor="system-prompt">System prompt</label>
              <textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => { setSystemPrompt(e.target.value); setSelectedPresetId(""); }}
                placeholder="Set the assistant's role, tone, and instructions..."
                rows="3"
              />
            </div>

            <div className="settings-field temperature-field">
              <div className="temperature-label-row"><label htmlFor="temperature">Temperature</label><output htmlFor="temperature">{temperature.toFixed(1)}</output></div>
              <input id="temperature" type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => { setTemperature(Number(e.target.value)); setSelectedPresetId(""); }} />
              <div className="temperature-hint"><span>Focused</span><span>Creative</span></div>
            </div>

            <div className="save-preset-row">
              <input value={presetName} onChange={(e) => setPresetName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && savePreset()} placeholder="Name this preset" aria-label="Preset name" />
              <button type="button" onClick={savePreset} disabled={!presetName.trim()}>Save preset</button>
            </div>
          </section>
        ) : null}

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
