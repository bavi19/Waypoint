"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Map,
  MessageSquareText,
  RefreshCcw,
  Route,
  Send,
  Shield,
  WalletCards
} from "lucide-react";
import type { ConversationMessage, ExpeditionState, ToolCallLog } from "@/lib/types";

interface Snapshot {
  id?: string;
  state: ExpeditionState;
  messages: ConversationMessage[];
  toolCalls: ToolCallLog[];
}

const starterMessages = [
  "Plan me a weekend backpacking trip in Joshua Tree.",
  "Upcoming weekend, group of 2, intermediate, budget $250. We own a tent, backpack, sleeping bag, and stove. We will drive.",
  "Option 1, Boy Scout Trail.",
  "approve",
  "payment complete"
];

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusTone(value?: string): string {
  if (!value) return "bg-stone-100 text-stone-700";
  if (["paid", "booked", "available", "placeholder_booked", "low"].includes(value)) return "bg-emerald-100 text-emerald-800";
  if (["approval_requested", "checkout_created", "moderate", "ready_to_book"].includes(value)) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-800";
}

function Panel({
  title,
  icon,
  children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

export function Dashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState(starterMessages[0]);
  const [isSending, setIsSending] = useState(false);

  const state = snapshot?.state;
  const total = useMemo(
    () => state?.costBreakdown.reduce((sum, item) => sum + item.amountCents, 0) ?? 0,
    [state?.costBreakdown]
  );

  async function loadSnapshot() {
    const response = await fetch("/api/hermes/message", { cache: "no-store" });
    setSnapshot(await response.json());
  }

  useEffect(() => {
    loadSnapshot();
  }, []);

  async function sendMessage(text = message) {
    if (!text.trim()) return;
    setIsSending(true);
    try {
      const response = await fetch("/api/hermes/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sender: "web-demo", message: text })
      });
      const data = await response.json();
      setSnapshot({
        state: data.state,
        messages: data.messages,
        toolCalls: data.toolCalls
      });
      setMessage("");
    } finally {
      setIsSending(false);
    }
  }

  async function resetDemo() {
    await fetch("/api/hermes/reset", { method: "POST" });
    await loadSnapshot();
    setMessage(starterMessages[0]);
  }

  async function markPaid() {
    setIsSending(true);
    try {
      const response = await fetch("/api/hermes/paid", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sender: "web-demo" })
      });
      const data = await response.json();
      setSnapshot({ state: data.state, messages: data.messages, toolCalls: data.toolCalls });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-ink">
      <section className="hero">
        <div className="heroOverlay" />
        <div className="relative z-10 mx-auto flex min-h-[420px] max-w-7xl flex-col justify-between px-5 py-6 sm:px-8 lg:px-10">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded bg-white/90 text-moss shadow-panel">
                <Route size={21} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/75">Waypoint Hermes</p>
                <h1 className="text-2xl font-semibold text-white">Expedition Operations</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded bg-white/90 px-3 py-2 text-sm font-medium text-moss shadow-panel sm:flex">
              <Shield size={16} />
              Powered by Hermes
            </div>
          </nav>

          <div className="max-w-2xl pb-5 text-white">
            <p className="mb-3 inline-flex rounded bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
              iMessage-first autonomous outdoor agent
            </p>
            <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Joshua Tree planning, logistics, payment, and briefing through one Hermes runtime.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/82">
              Every message routes through the Hermes orchestrator: it asks intake questions, calls tools, updates
              expedition state, requests payment approval, and produces the final brief.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 sm:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:px-10">
        <div className="space-y-5">
          <section className="panel min-h-[620px]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquareText size={20} className="text-moss" />
                <h3 className="font-semibold">iMessage / Web Chat Simulator</h3>
              </div>
              <button className="iconButton" onClick={resetDemo} title="Reset demo">
                <RefreshCcw size={17} />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {starterMessages.map((starter) => (
                <button key={starter} className="quickButton" onClick={() => setMessage(starter)}>
                  {starter.length > 42 ? `${starter.slice(0, 42)}...` : starter}
                </button>
              ))}
            </div>

            <div className="chatWindow">
              {!snapshot?.messages.length ? (
                <div className="emptyState">
                  Text Hermes to start the Joshua Tree weekend backpacking demo.
                </div>
              ) : (
                snapshot.messages.map((item) => (
                  <div key={item.id} className={`bubbleRow ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`bubble ${item.role === "user" ? "userBubble" : "hermesBubble"}`}>
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-65">
                        {item.role === "user" ? "iMessage user" : "Hermes"}
                      </div>
                      <div className="whitespace-pre-wrap">{item.content}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <textarea
                className="messageInput"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Text Hermes..."
                rows={2}
              />
              <button className="sendButton" onClick={() => sendMessage()} disabled={isSending}>
                <Send size={18} />
              </button>
            </div>
          </section>

          <Panel title="Hermes Tool Calls" icon={<ClipboardList size={18} className="text-moss" />}>
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {snapshot?.toolCalls.length ? (
                snapshot.toolCalls.slice().reverse().map((tool) => (
                  <details key={tool.id} className="toolLog">
                    <summary className="cursor-pointer font-mono text-xs font-semibold text-storm">
                      {tool.name}
                    </summary>
                    <pre>{JSON.stringify(tool.output, null, 2)}</pre>
                  </details>
                ))
              ) : (
                <p className="text-sm text-stone-600">No tools called yet. Intake starts conversationally, then Hermes logs every operation here.</p>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Expedition State" icon={<Map size={18} className="text-moss" />}>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["Destination", state?.destination || "Pending"],
                ["Dates", state?.dates || "Pending"],
                ["Group", state?.groupSize ? `${state.groupSize}` : "Pending"],
                ["Experience", state?.experienceLevel || "Pending"],
                ["Budget", state?.budget || "Pending"],
                ["Transport", state?.transportation || "Pending"]
              ].map(([label, value]) => (
                <div key={label} className="stateCell">
                  <div className="stateLabel">{label}</div>
                  <div className="font-medium">{value}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Route / Map" icon={<Route size={18} className="text-moss" />}>
            <h3 className="text-lg font-semibold">{state?.selectedRoute?.name || "Awaiting route selection"}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {state?.selectedRoute?.summary || "Hermes will propose Boy Scout Trail, California Riding and Hiking Trail, and a Pine City fallback once intake is complete."}
            </p>
            {state?.selectedRoute?.mapLink && (
              <a className="mt-3 inline-flex items-center gap-2 rounded bg-moss px-3 py-2 text-sm font-semibold text-white" href={state.selectedRoute.mapLink} target="_blank">
                <Map size={16} />
                Open map link
              </a>
            )}
          </Panel>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Panel title="Risk" icon={<AlertTriangle size={18} className="text-ember" />}>
              <div className="space-y-2 text-sm">
                <span className={`pill ${statusTone(state?.weatherRisk.riskLevel)}`}>Weather: {state?.weatherRisk.riskLevel || "unknown"}</span>
                <span className={`pill ${statusTone(state?.safetyRisk)}`}>Safety: {state?.safetyRisk || "unknown"}</span>
                <p className="leading-6 text-stone-700">{state?.weatherRisk.forecast || "Weather wrapper has not run."}</p>
              </div>
            </Panel>

            <Panel title="Permit" icon={<CheckCircle2 size={18} className="text-moss" />}>
              <span className={`pill ${statusTone(state?.permits.status)}`}>{state?.permits.status || "unknown"}</span>
              <p className="mt-2 text-sm leading-6 text-stone-700">{state?.permits.notes}</p>
            </Panel>
          </div>

          <Panel title="Gear Checklist" icon={<ClipboardList size={18} className="text-moss" />}>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              {(state?.packingList.length ? state.packingList : ["Packing list pending Hermes logistics run."]).map((item) => (
                <div key={item} className="checkItem">
                  <CheckCircle2 size={15} />
                  {item}
                </div>
              ))}
            </div>
            {!!state?.missingGear.length && (
              <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                Missing gear: {state.missingGear.join(", ")}
              </div>
            )}
          </Panel>

          <Panel title="Payment / Booking" icon={<CreditCard size={18} className="text-moss" />}>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className={`pill ${statusTone(state?.paymentStatus)}`}>Payment: {state?.paymentStatus || "pending"}</span>
              <span className={`pill ${statusTone(state?.bookingStatus)}`}>Booking: {state?.bookingStatus || "pending"}</span>
            </div>
            {!!state?.costBreakdown.length && (
              <div className="space-y-1 text-sm">
                {state.costBreakdown.map((item) => (
                  <div key={item.label} className="flex justify-between gap-3">
                    <span>{item.label}</span>
                    <span className="font-semibold">{money(item.amountCents)}</span>
                  </div>
                ))}
                <div className="border-t border-stone-200 pt-2 font-semibold">Total {money(total)}</div>
              </div>
            )}
            {state?.payment?.checkoutUrl && (
              <a className="mt-3 inline-flex items-center gap-2 rounded bg-clay px-3 py-2 text-sm font-semibold text-white" href={state.payment.checkoutUrl} target="_blank">
                <WalletCards size={16} />
                Open checkout
              </a>
            )}
            {state?.paymentStatus === "checkout_created" && (
              <button className="ml-2 mt-3 rounded bg-ink px-3 py-2 text-sm font-semibold text-white" onClick={markPaid} disabled={isSending}>
                Mark demo paid
              </button>
            )}
          </Panel>

          {state?.finalBrief && (
            <Panel title="Final Expedition Brief" icon={<Shield size={18} className="text-moss" />}>
              <pre className="brief">{state.finalBrief}</pre>
            </Panel>
          )}
        </div>
      </section>
    </main>
  );
}
