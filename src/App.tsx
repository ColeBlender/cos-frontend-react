import { useState, useEffect, useRef } from "react";
import type { EmailData, ConnectionStatus, SSEMessage } from "./types";

function App() {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource("http://localhost:3001/events");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionStatus("connected");
      console.log("Connected to email stream");
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data: SSEMessage = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("SSE connection established:", data.message);
        } else if (data.type === "email" && data.data) {
          // Add new email to the beginning of the list
          setEmails((prevEmails) => [data.data!, ...prevEmails]);
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE error");
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

  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === "Unknown") return "Unknown";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (): string => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-orange-500";
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-600 to-purple-800 p-5">
      <header className="max-w-6xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800">📧 Email Notifier</h1>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}
          ></span>
          <span className="font-medium text-gray-600">
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "error"
              ? "Connection Error"
              : "Connecting..."}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {emails.length === 0 ? (
          <div className="bg-white p-16 rounded-xl text-center shadow-lg">
            <p className="text-lg text-gray-600 mb-2">
              Waiting for new emails...
            </p>
            <p className="text-sm text-gray-500 italic">
              Make sure the API hook is running on port 3001
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {emails.map((email, index) => (
              <div
                key={`${email.messageId}-${index}`}
                className="bg-white rounded-xl p-6 shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl animate-in slide-in-from-top-2"
              >
                <div className="flex justify-between items-start mb-4 gap-5">
                  <div className="text-xl font-semibold text-gray-800 flex-1">
                    {email.subject}
                  </div>
                  <div className="text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(email.receivedDate)}
                  </div>
                </div>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700 mb-1.5">
                    <strong className="text-gray-900">From:</strong>{" "}
                    {email.from}
                  </div>
                  <div className="text-sm text-gray-700 mb-1.5">
                    <strong className="text-gray-900">To:</strong> {email.to}
                  </div>
                  {email.cc && (
                    <div className="text-sm text-gray-700">
                      <strong className="text-gray-900">CC:</strong> {email.cc}
                    </div>
                  )}
                </div>
                {email.snippet && (
                  <div className="my-4 p-3 bg-gray-50 border-l-4 border-purple-500 text-gray-600 italic rounded">
                    {email.snippet}
                  </div>
                )}
                {email.bodyPreview && (
                  <div className="my-4">
                    <details className="cursor-pointer">
                      <summary className="p-2 bg-gray-100 rounded font-medium text-purple-600 hover:bg-gray-200">
                        View body preview
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-50 rounded overflow-x-auto whitespace-pre-wrap break-words text-sm text-gray-700">
                        {email.bodyPreview}
                      </pre>
                    </details>
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center flex-wrap gap-3 text-xs text-gray-500">
                  <span className="font-mono">ID: {email.messageId}</span>
                  {email.labels.length > 0 && (
                    <span className="flex gap-1.5 flex-wrap">
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

