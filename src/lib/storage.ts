import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { ConversationMessage, ExpeditionState, ToolCallLog } from "@/lib/types";
import { createInitialExpeditionState } from "@/lib/hermes/state";

interface ConversationRow {
  id: string;
  sender: string;
  state_json: string;
  messages_json: string;
  tool_calls_json: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationSnapshot {
  id: string;
  sender: string;
  state: ExpeditionState;
  messages: ConversationMessage[];
  toolCalls: ToolCallLog[];
  createdAt: string;
  updatedAt: string;
}

const globalForDb = globalThis as typeof globalThis & { waypointHermesDb?: Database.Database };

function databasePath(): string {
  const url = process.env.DATABASE_URL || "file:./.data/waypoint-hermes.sqlite";
  const filePath = url.startsWith("file:") ? url.slice(5) : url;
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

function getDb(): Database.Database {
  if (globalForDb.waypointHermesDb) {
    return globalForDb.waypointHermesDb;
  }

  const dbPath = databasePath();
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    create table if not exists conversations (
      id text primary key,
      sender text not null,
      state_json text not null,
      messages_json text not null,
      tool_calls_json text not null,
      created_at text not null,
      updated_at text not null
    );
  `);
  globalForDb.waypointHermesDb = db;
  return db;
}

function rowToSnapshot(row: ConversationRow): ConversationSnapshot {
  return {
    id: row.id,
    sender: row.sender,
    state: JSON.parse(row.state_json) as ExpeditionState,
    messages: JSON.parse(row.messages_json) as ConversationMessage[],
    toolCalls: JSON.parse(row.tool_calls_json) as ToolCallLog[],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function getOrCreateConversation(sender: string): ConversationSnapshot {
  const db = getDb();
  const id = sender || "web-demo";
  const existing = db.prepare("select * from conversations where id = ?").get(id) as ConversationRow | undefined;
  if (existing) {
    return rowToSnapshot(existing);
  }

  const now = new Date().toISOString();
  const snapshot: ConversationSnapshot = {
    id,
    sender: id,
    state: createInitialExpeditionState(id),
    messages: [],
    toolCalls: [],
    createdAt: now,
    updatedAt: now
  };

  db.prepare(
    "insert into conversations (id, sender, state_json, messages_json, tool_calls_json, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    snapshot.id,
    snapshot.sender,
    JSON.stringify(snapshot.state),
    JSON.stringify(snapshot.messages),
    JSON.stringify(snapshot.toolCalls),
    snapshot.createdAt,
    snapshot.updatedAt
  );

  return snapshot;
}

export function saveConversation(snapshot: ConversationSnapshot): ConversationSnapshot {
  const db = getDb();
  const updatedAt = new Date().toISOString();
  db.prepare(
    "update conversations set state_json = ?, messages_json = ?, tool_calls_json = ?, updated_at = ? where id = ?"
  ).run(
    JSON.stringify(snapshot.state),
    JSON.stringify(snapshot.messages),
    JSON.stringify(snapshot.toolCalls),
    updatedAt,
    snapshot.id
  );

  return { ...snapshot, updatedAt };
}

export function getConversation(sender = "web-demo"): ConversationSnapshot {
  return getOrCreateConversation(sender);
}

export function resetConversation(sender = "web-demo"): ConversationSnapshot {
  const db = getDb();
  db.prepare("delete from conversations where id = ?").run(sender);
  return getOrCreateConversation(sender);
}
