import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ChatAdmin.css";

// Admin-only dashboard for reviewing chat and token usage across accounts.
function MNGChatAdmin() {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value ?? 0);

  const formatDateTime = (value) => {
    if (!value) return "No usage yet";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Backend errors may be JSON or plain text, so handle both formats for display.
  const parseErrorMessage = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    try {
      if (contentType.includes("application/json")) {
        const data = await response.json();
        return (
          data.message ||
          data.error ||
          data.details ||
          JSON.stringify(data)
        );
      }

      const text = await response.text();
      return text || `Request failed with status ${response.status}`;
    } catch {
      return `Request failed with status ${response.status}`;
    }
  };

  // Retrieve protected usage data and turn common authorization errors into clear UI states.
  const loadUsage = useCallback(async () => {
    if (!token) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/chat/admin/usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError("401 Unauthorized: Login expired. Please sign in again.");
        setLoading(false);
        return;
      }

      if (response.status === 403) {
        const message = await parseErrorMessage(response);
        setError(`403 Forbidden: ${message}`);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const message = await parseErrorMessage(response);
        throw new Error(message);
      }

      const data = await response.json();
      setUsage(data);
    } catch (fetchError) {
      setError(fetchError?.message || "Unable to load usage data right now.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  return (
    <div className="chat-admin-page">
      <div className="chat-admin-shell">
        <header className="chat-admin-hero">
          <div>
            <p className="chat-admin-eyebrow">Chat Admin</p>
            <h1>Account Usage Monitor</h1>
            <p className="chat-admin-subtitle">
              Track token consumption and model mix for every account in one place.
            </p>
          </div>

          <div className="chat-admin-actions">
            <button type="button" className="chat-admin-refresh" onClick={loadUsage} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <Link className="chat-admin-link" to="/chat">
              Back to Chat
            </Link>
          </div>
        </header>

        {error ? (
          <section className="chat-admin-state">
            <h2>Access Status</h2>
            <p>{error}</p>
          </section>
        ) : null}

        {!error && loading ? (
          <section className="chat-admin-state">
            <h2>Loading usage data</h2>
            <p>Pulling the latest token and model activity from the server.</p>
          </section>
        ) : null}

        {!error && !loading && usage ? (
          <>
            <section className="chat-admin-summary-grid">
              <article className="chat-admin-card">
                <span className="chat-admin-label">Accounts</span>
                <strong>{formatNumber(usage.accountCount)}</strong>
              </article>
              <article className="chat-admin-card">
                <span className="chat-admin-label">Requests</span>
                <strong>{formatNumber(usage.requestCount)}</strong>
              </article>
              <article className="chat-admin-card">
                <span className="chat-admin-label">Prompt Tokens</span>
                <strong>{formatNumber(usage.promptTokens)}</strong>
              </article>
              <article className="chat-admin-card">
                <span className="chat-admin-label">Completion Tokens</span>
                <strong>{formatNumber(usage.completionTokens)}</strong>
              </article>
              <article className="chat-admin-card chat-admin-card-wide">
                <span className="chat-admin-label">Total Tokens</span>
                <strong>{formatNumber(usage.totalTokens)}</strong>
                <small>Generated {formatDateTime(usage.generatedAt)}</small>
              </article>
            </section>

            <section className="chat-admin-table-wrap">
              <div className="chat-admin-table-header">
                <div>
                  <h2>Per Account Breakdown</h2>
                  <p>Sorted by total token usage on the backend.</p>
                </div>
              </div>

              {usage.users?.length ? (
                <div className="chat-admin-user-list">
                  {usage.users.map((user) => (
                    <article key={user.email} className="chat-admin-user-card">
                      <div className="chat-admin-user-top">
                        <div>
                          <h3>{user.username || user.email}</h3>
                          <p>{user.email}</p>
                        </div>
                        <div className="chat-admin-user-meta">
                          <span>{formatNumber(user.sessionCount)} sessions</span>
                          <span>{formatDateTime(user.lastUsedAt)}</span>
                        </div>
                      </div>

                      <div className="chat-admin-stats-row">
                        <div>
                          <span>Requests</span>
                          <strong>{formatNumber(user.requestCount)}</strong>
                        </div>
                        <div>
                          <span>Prompt</span>
                          <strong>{formatNumber(user.promptTokens)}</strong>
                        </div>
                        <div>
                          <span>Completion</span>
                          <strong>{formatNumber(user.completionTokens)}</strong>
                        </div>
                        <div>
                          <span>Total</span>
                          <strong>{formatNumber(user.totalTokens)}</strong>
                        </div>
                      </div>

                      <div className="chat-admin-model-block">
                        <div className="chat-admin-model-title-row">
                          <h4>Model Usage</h4>
                        </div>
                        <div className="chat-admin-model-table">
                          <div className="chat-admin-model-head">
                            <span>Model</span>
                            <span>Requests</span>
                            <span>Prompt</span>
                            <span>Completion</span>
                            <span>Total</span>
                          </div>
                          {(user.models || []).map((model) => (
                            <div key={`${user.email}-${model.model}`} className="chat-admin-model-row">
                              <span>{model.model}</span>
                              <span>{formatNumber(model.requestCount)}</span>
                              <span>{formatNumber(model.promptTokens)}</span>
                              <span>{formatNumber(model.completionTokens)}</span>
                              <span>{formatNumber(model.totalTokens)}</span>
                            </div>
                          ))}
                          {(!user.models || user.models.length === 0) ? (
                            <div className="chat-admin-model-empty">No model usage recorded yet.</div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="chat-admin-empty">
                  No account usage has been recorded yet.
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default MNGChatAdmin;
