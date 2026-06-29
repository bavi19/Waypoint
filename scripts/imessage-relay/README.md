# Demo-Only iMessage Relay

This relay is intentionally local and demo-only. It polls the macOS Messages SQLite database for an allowlisted sender, forwards the text to Junko, and sends Junko's response back through the Messages app with AppleScript.

## Requirements

- macOS with Messages signed into iMessage.
- Full Disk Access granted to the terminal app running the relay, because `~/Library/Messages/chat.db` is protected.
- Automation permission for the terminal app to control Messages.
- `IMESSAGE_ALLOWED_SENDER` set to the exact handle/phone number being used for the demo.

## Run

```bash
npm run dev
IMESSAGE_ALLOWED_SENDER="+15555550123" npm run imessage:relay
```

Optional variables:

```bash
JUNKO_BACKEND_URL=http://localhost:3000/api/relay/imessage
IMESSAGE_CHAT_DB="$HOME/Library/Messages/chat.db"
IMESSAGE_POLL_MS=3500
```

If this relay fails during the hackathon demo, use the web chat simulator. It routes through the same Hermes orchestrator and tools.
