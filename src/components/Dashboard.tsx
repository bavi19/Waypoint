"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Info, MessageCircle, Mountain, RefreshCcw, Send } from "lucide-react";
import type { ConversationMessage, ExpeditionState, ToolCallLog } from "@/lib/types";

interface Snapshot {
  id?: string;
  state: ExpeditionState;
  messages: ConversationMessage[];
  toolCalls: ToolCallLog[];
}

type ViewMode = "landing" | "chat";

const backgroundImages = Array.from({ length: 18 }, (_, index) => `/backgrounds/waypoint-bg-${String(index + 1).padStart(2, "0")}.jpg`);

const demoMessages = [
  "Plan me a weekend backpacking trip in Joshua Tree.",
  "Upcoming weekend, group of 2, intermediate, budget $250. We own a tent, backpack, sleeping bag, and stove. We will drive.",
  "Option 1, Boy Scout Trail.",
  "approve",
  "payment complete"
];

function briefSummary(state?: ExpeditionState) {
  if (!state) return [];
  return [
    { label: "Route", value: state.selectedRoute?.name || "Selected route pending" },
    { label: "Payment", value: state.paymentStatus.replaceAll("_", " ") },
    { label: "Permit", value: state.permits.notes },
    {
      label: "Safety",
      value:
        "Joshua Tree has limited/no reliable water. Verify current conditions, official park alerts, weather, and legal camping requirements before departure."
    }
  ];
}

function BackgroundSlideshow({ activeIndex, dimmed = false }: { activeIndex: number; dimmed?: boolean }) {
  return (
    <div className={`backgroundSlideshow ${dimmed ? "dimmed" : ""}`} aria-hidden="true">
      {backgroundImages.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={index === 0}
          sizes="100vw"
          className={`backgroundImage ${activeIndex === index ? "active" : ""}`}
        />
      ))}
      <div className="photoOverlay" />
    </div>
  );
}

function OnlineBadge() {
  return (
    <div className="onlineBadge">
      <span />
      Hermes agent online
    </div>
  );
}

function ChatBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`chatBubbleRow ${isUser ? "fromUser" : "fromWaypoint"}`}>
      <div className={`messageBubble ${isUser ? "userText" : "waypointText"}`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<ViewMode>("landing");
  const [activeImage, setActiveImage] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const state = snapshot?.state;
  const summary = useMemo(() => briefSummary(state), [state]);

  async function loadSnapshot() {
    const response = await fetch("/api/hermes/message", { cache: "no-store" });
    setSnapshot(await response.json());
  }

  useEffect(() => {
    loadSnapshot();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % backgroundImages.length);
    }, 6200);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [snapshot?.messages, isSending, view]);

  async function sendMessage(text = message) {
    const outgoing = text.trim();
    if (!outgoing) return;
    setIsSending(true);
    setView("chat");
    try {
      const response = await fetch("/api/hermes/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sender: "web-demo", message: outgoing })
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
    setMessage("");
    setCopied(false);
  }

  async function copyBrief() {
    if (!state?.finalBrief) return;
    await navigator.clipboard.writeText(state.finalBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (view === "landing") {
    return (
      <main className="immersiveShell">
        <BackgroundSlideshow activeIndex={activeImage} />

        <header className="landingNav">
          <div className="wordmark">
            <Mountain size={20} />
            <span>WAYPOINT</span>
          </div>
          <OnlineBadge />
        </header>

        <section className="immersiveHero">
          <div className="heroCenter">
            <h1>
              Text Waypoint.
              <br />
              Get your trip planned.
            </h1>
            <p>
              Waypoint is an iMessage-first expedition agent that plans routes, checks conditions, handles gear,
              asks before payment, and sends you a final trip brief.
            </p>
            <div className="heroActions">
              <button className="primaryAction" onClick={() => setView("chat")}>
                <MessageCircle size={19} />
                Start demo chat
              </button>
              <a className="secondaryAction" href="#how-it-works">
                How it works {">"}
              </a>
            </div>
          </div>

          <form
            className="landingComposer"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Text Waypoint..." />
            <button type="submit" disabled={isSending || !message.trim()} title="Send to Waypoint">
              <Send size={20} />
            </button>
          </form>
        </section>

        <section id="how-it-works" className="immersiveHow">
          {[
            ["Text naturally", "Ask for a trip the way you would text a friend."],
            ["Hermes plans", "Waypoint checks routes, conditions, permits, gear, and budget."],
            ["Approve first", "Payment waits for your yes, then the final brief arrives."]
          ].map(([title, body]) => (
            <article key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="chatShell">
      <BackgroundSlideshow activeIndex={activeImage} dimmed />

      <section className="chatApp">
        <header className="chatTopBar">
          <button className="roundIcon" onClick={() => setView("landing")} title="Back to landing">
            <ArrowLeft size={18} />
          </button>
          <div className="agentTitle">
            <h1>Waypoint</h1>
            <p>Hermes agent online</p>
          </div>
          <button className="roundIcon" onClick={resetDemo} title="Reset demo">
            <RefreshCcw size={17} />
          </button>
        </header>

        <div className="chatOnlyWindow">
          {!snapshot?.messages.length ? (
            <div className="chatEmpty">
              <div className="emptyIcon">
                <MessageCircle size={24} />
              </div>
              <h2>Start with a text.</h2>
              <p>Try asking Waypoint to plan a weekend backpacking trip in Joshua Tree.</p>
            </div>
          ) : (
            snapshot.messages.map((item) => <ChatBubble key={item.id} message={item} />)
          )}
          {isSending && (
            <div className="chatBubbleRow fromWaypoint">
              <div className="typingBubble">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="scriptBar">
          <button className="scriptToggle" onClick={() => setShowScript((next) => !next)}>
            Demo script
          </button>
          <button className="debugToggle" onClick={() => setShowDebug((next) => !next)}>
            <Info size={14} />
            Debug
          </button>
        </div>

        {showScript && (
          <div className="scriptDrawer">
            {demoMessages.map((demo, index) => (
              <button key={demo} onClick={() => setMessage(demo)}>
                <span>{index + 1}</span>
                {demo}
              </button>
            ))}
          </div>
        )}

        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Text Waypoint..."
            rows={1}
          />
          <button type="submit" disabled={isSending || !message.trim()} title="Send">
            <Send size={18} />
          </button>
        </form>
      </section>

      {state?.finalBrief && (
        <section className="briefCard">
          <div className="briefHeader">
            <div>
              <p>Shareable plan</p>
              <h2>Your Expedition Brief</h2>
            </div>
            <button onClick={copyBrief}>
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? "Copied" : "Copy brief"}
            </button>
          </div>
          <div className="briefSummary">
            {summary.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
          {state.selectedRoute?.mapLink && (
            <a className="mapLink" href={state.selectedRoute.mapLink} target="_blank">
              Open route map
            </a>
          )}
          <pre>{state.finalBrief}</pre>
        </section>
      )}

      {showDebug && (
        <section className="debugPanel">
          <h2>Debug tool calls</h2>
          {snapshot?.toolCalls.length ? (
            snapshot.toolCalls.slice().reverse().map((tool) => (
              <details key={tool.id}>
                <summary>{tool.name}</summary>
                <pre>{JSON.stringify(tool.output, null, 2)}</pre>
              </details>
            ))
          ) : (
            <p>No tool calls yet.</p>
          )}
        </section>
      )}
    </main>
  );
}
