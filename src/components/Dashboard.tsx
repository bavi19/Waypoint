"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useRef, useState } from "react";

const backgroundImages = Array.from({ length: 18 }, (_, index) => `/backgrounds/waypoint-bg-${String(index + 1).padStart(2, "0")}.jpg`);

function BackgroundSlideshow({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="backgroundSlideshow" aria-hidden="true">
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
    <div className="statusStack">
      <div className="onlineBadge">
        <span />
        Powered by Nous
      </div>
      <p>Junko is online</p>
    </div>
  );
}

function JunkoLogo({ size = 34 }: { size?: number }) {
  return (
    <Image
      src="/assets/junko-logo.png"
      alt="Junko"
      width={size}
      height={size}
      className="junkoLogo"
      priority={size > 40}
    />
  );
}

function MessagesIcon() {
  return (
    <span className="messagesIcon" aria-hidden="true">
      <svg viewBox="0 0 32 32" role="img">
        <path d="M16 4C9.4 4 4 8.6 4 14.3c0 3.4 1.9 6.4 4.9 8.2-.2 1.8-.9 3.6-2.2 5.2 2.3-.5 4.4-1.5 6.1-3 1 .2 2.1.3 3.2.3 6.6 0 12-4.6 12-10.3S22.6 4 16 4Z" />
      </svg>
    </span>
  );
}

export function Dashboard() {
  const [activeImage, setActiveImage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [howVisible, setHowVisible] = useState(false);
  const howRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % backgroundImages.length);
    }, 6200);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateScroll = () => {
      const progress = Math.min(window.scrollY / Math.max(window.innerHeight * 0.82, 1), 1);
      setScrollProgress(Number(progress.toFixed(3)));
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  useEffect(() => {
    const section = howRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHowVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.24 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const landingStyle = {
    "--bg-scale": 1 + scrollProgress * 0.035,
    "--hero-opacity": Math.max(0, 1 - scrollProgress * 1.25),
    "--hero-shift": `${scrollProgress * -42}px`,
    "--hero-blur": `${scrollProgress * 4}px`
  } as CSSProperties;

  return (
    <main className="immersiveShell" style={landingStyle}>
      <BackgroundSlideshow activeIndex={activeImage} />

      <header className="landingNav">
        <div className="wordmark">
          <JunkoLogo />
        </div>
        <OnlineBadge />
      </header>

      <section className="immersiveHero">
        <div className="heroCenter">
          <h1>
            Text Junko.
            <br />
            Get your trip planned.
          </h1>
          <p>
            Junko is a friendly outdoor expedition companion that plans routes, checks conditions, handles gear,
            asks before payment, and sends you a final adventure brief.
          </p>
          <div className="heroActions">
            <a className="primaryAction imessageAction" href="sms:+14243951051">
              <MessagesIcon />
              Message on iMessage
            </a>
          </div>
        </div>

        <button
          className="downArrow"
          onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          title="Scroll to how Junko works"
        >
          {"\u2193"}
        </button>
      </section>

      <section id="how-it-works" ref={howRef} className={`immersiveHow ${howVisible ? "visible" : ""}`}>
        <div className="howIntro">
          <p>Simple, text-native expedition planning</p>
          <h2>How Junko works</h2>
        </div>
        {[
          ["Text your trip idea", "Tell Junko where you want to go, when, and your group size."],
          ["Junko maps the route", "She checks routes, conditions, permits, gear, and risk."],
          ["Approve payment", "Junko asks before checkout or vendor booking."],
          ["Get your adventure brief", "Receive a final expedition plan with map links, gear, safety, and next steps."]
        ].map(([title, body], index) => (
          <article key={title} className="howCard" style={{ "--card-index": index } as CSSProperties}>
            <span>{index + 1}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
