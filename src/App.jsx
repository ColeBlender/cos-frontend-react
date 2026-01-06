import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [emails, setEmails] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const eventSourceRef = useRef(null);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource("http://localhost:3001/events");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionStatus("connected");
      console.log("Connected to email stream");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("SSE connection established:", data.message);
        } else if (data.type === "email") {
          // Add new email to the beginning of the list
          setEmails((prevEmails) => [data.data, ...prevEmails]);
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setConnectionStatus("error");
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          eventSource.close();
          // The component will re-run useEffect and reconnect
        }
      }, 5000);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString || dateString === "Unknown") return "Unknown";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#4caf50";
      case "error":
        return "#f44336";
      default:
        return "#ff9800";
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📧 Email Notifier</h1>
        <div className="status-indicator">
          <span
            className="status-dot"
            style={{ backgroundColor: getStatusColor() }}
          ></span>
          <span className="status-text">
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "error"
              ? "Connection Error"
              : "Connecting..."}
          </span>
        </div>
      </header>

      <main className="email-container">
        {emails.length === 0 ? (
          <div className="empty-state">
            <p>Waiting for new emails...</p>
            <p className="hint">
              Make sure the API hook is running on port 3001
            </p>
          </div>
        ) : (
          <div className="email-list">
            {emails.map((email, index) => (
              <div key={`${email.messageId}-${index}`} className="email-card">
                <div className="email-header">
                  <div className="email-subject">{email.subject}</div>
                  <div className="email-date">
                    {formatDate(email.receivedDate)}
                  </div>
                </div>
                <div className="email-meta">
                  <div className="email-from">
                    <strong>From:</strong> {email.from}
                  </div>
                  <div className="email-to">
                    <strong>To:</strong> {email.to}
                  </div>
                  {email.cc && (
                    <div className="email-cc">
                      <strong>CC:</strong> {email.cc}
                    </div>
                  )}
                </div>
                {email.snippet && (
                  <div className="email-snippet">{email.snippet}</div>
                )}
                {email.bodyPreview && (
                  <div className="email-body">
                    <details>
                      <summary>View body preview</summary>
                      <pre>{email.bodyPreview}</pre>
                    </details>
                  </div>
                )}
                <div className="email-footer">
                  <span className="email-id">ID: {email.messageId}</span>
                  {email.labels.length > 0 && (
                    <span className="email-labels">
                      Labels: {email.labels.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
