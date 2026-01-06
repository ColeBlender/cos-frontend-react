export interface EmailData {
  messageId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  replyTo?: string;
  sentDate: string;
  receivedDate: string;
  snippet: string;
  bodyPreview: string;
  labels: string[];
  timestamp: string;
}

export interface SSEMessage {
  type: "connected" | "email";
  message?: string;
  data?: EmailData;
}

export type ConnectionStatus = "connected" | "error" | "disconnected";

