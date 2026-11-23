"use client";

import { useState, type FormEvent } from "react";

/** POST /api/subscribe -> { status, message }. Success is shown only on a 2xx response. */
const SUBSCRIBE_ENDPOINT = "/api/subscribe";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = "idle" | "loading" | "success" | "error";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    const value = email.trim();

    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setMessage("Enter a valid email address, for example name@example.com.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(SUBSCRIBE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, website }),
      });

      let data: { status?: string; message?: string } = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "We couldn't complete your subscription. Please try again in a moment.");
        return;
      }

      // Only a 2xx from the server counts. "pending" = confirmation email sent.
      setStatus("success");
      setMessage(data.message || "Check your inbox for a confirmation link.");
      if (data.status === "pending") setEmail("");
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the server. Check your connection and try again.");
    }
  }

  const loading = status === "loading";
  const empty = email.trim().length === 0;

  return (
    <form onSubmit={onSubmit} noValidate>
      <h2 className="text-xl font-semibold">Join The JnV Weekly</h2>
      <p className="mt-3 text-sm text-[#5a6b85]">
        Enter your email address to receive our weekly newsletter.
      </p>

      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="Your email address"
        value={email}
        disabled={loading}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        aria-invalid={status === "error"}
        aria-describedby="subscribe-msg"
        className="mt-3 w-full rounded-full border border-[#d5d9e2] bg-white px-5 py-3 text-lg text-[#1a2b4c] placeholder:text-[#8a8f99] focus:border-[#2674D9] focus:outline-none focus:ring-2 focus:ring-[#2674D9]/30 disabled:opacity-70"
      />

      <button
        type="submit"
        disabled={loading || empty}
        className="mt-3 w-full rounded-full bg-[#2674D9] px-6 py-3 text-lg text-white transition-colors hover:bg-[#1b5fb8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2674D9] disabled:cursor-not-allowed disabled:bg-[#f3f3f3] disabled:text-[#8a8f99]"
      >
        {loading ? "Submitting…" : "Submit"}
      </button>

      <p
        id="subscribe-msg"
        role={status === "error" ? "alert" : "status"}
        aria-live="polite"
        className={`mt-3 text-center text-sm ${
          status === "error" ? "text-red-700" : "text-[#0a6b3a]"
        } ${message ? "" : "hidden"}`}
      >
        {message}
      </p>

      <p className="mt-3 text-center text-base text-[#5a6b85]">
        Free forever. Unsubscribe anytime.
      </p>
    </form>
  );
}
