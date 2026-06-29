import Database from "better-sqlite3";
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const backendUrl = process.env.JUNKO_BACKEND_URL || "http://localhost:3000/api/relay/imessage";
const allowedSender = process.env.IMESSAGE_ALLOWED_SENDER;
const messagesDbPath = process.env.IMESSAGE_CHAT_DB || path.join(homedir(), "Library", "Messages", "chat.db");
const pollMs = Number(process.env.IMESSAGE_POLL_MS || 3500);

let lastSeenDate = 0;

interface IncomingMessageRow {
  text: string;
  sender: string;
  message_date: number;
}

function requireMacRelayConfig() {
  if (process.platform !== "darwin") {
    throw new Error("The iMessage relay is demo-only and must run on macOS with Messages configured.");
  }

  if (!allowedSender) {
    throw new Error("Set IMESSAGE_ALLOWED_SENDER to the phone number or handle allowed to text the demo.");
  }
}

function readIncomingMessages(): IncomingMessageRow[] {
  const db = new Database(messagesDbPath, { readonly: true, fileMustExist: true });
  try {
    const rows = db
      .prepare(
        `
          select
            message.text as text,
            handle.id as sender,
            message.date as message_date
          from message
          join handle on handle.rowid = message.handle_id
          where message.is_from_me = 0
            and message.text is not null
            and handle.id = ?
            and message.date > ?
          order by message.date asc
          limit 10
        `
      )
      .all(allowedSender, lastSeenDate) as IncomingMessageRow[];

    if (rows.length) {
      lastSeenDate = rows[rows.length - 1].message_date;
    }

    return rows;
  } finally {
    db.close();
  }
}

async function sendIMessage(recipient: string, text: string) {
  const script = `
    tell application "Messages"
      set targetService to 1st service whose service type = iMessage
      set targetBuddy to buddy "${recipient}" of targetService
      send ${JSON.stringify(text)} to targetBuddy
    end tell
  `;
  await execFileAsync("osascript", ["-e", script]);
}

async function forwardToHermes(row: IncomingMessageRow) {
  const response = await fetch(backendUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sender: row.sender, text: row.text })
  });

  if (!response.ok) {
    throw new Error(`Junko backend rejected message: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { recipient: string; text: string };
  await sendIMessage(payload.recipient, payload.text);
}

async function poll() {
  for (const row of readIncomingMessages()) {
    await forwardToHermes(row);
  }
}

async function main() {
  requireMacRelayConfig();
  console.log(`Junko demo relay watching ${allowedSender}`);
  console.log(`Forwarding to ${backendUrl}`);

  setInterval(() => {
    poll().catch((error) => {
      console.error(`[relay] ${error instanceof Error ? error.message : String(error)}`);
    });
  }, pollMs);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
