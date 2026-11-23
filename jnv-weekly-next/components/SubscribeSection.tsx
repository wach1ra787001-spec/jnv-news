"use client";

import { useState } from "react";
import SubscribeForm from "./SubscribeForm";

export default function SubscribeSection() {
  const [open, setOpen] = useState(true);

  return (
    <section className="text-center" aria-labelledby="subscribe-heading">
      <span className="inline-block rounded-full bg-[#d3f1e1] px-3 py-1 text-sm text-[#0a8a4a]">
        100% FREE · NO SUBSCRIPTION FEES
      </span>
      <h1
        id="subscribe-heading"
        className="mt-6 text-[1.6rem] font-semibold leading-tight sm:text-3xl"
      >
        Become the Trader You Set Out to Be.
      </h1>
      <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[#5a6b85]">
        Better trading starts with better habits. Get weekly insights, reflect on
        your performance, and take control of your trading development.
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="subscribe-panel"
        className="mt-5 w-full rounded-full bg-[#2e2e2e] px-6 py-3 text-base text-white transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2674D9]"
      >
        {open ? "Close subscription form" : "Open subscription form"}
      </button>

      <div
        id="subscribe-panel"
        className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-4 rounded-xl border border-[#e1e5ee] bg-white p-4 text-left sm:p-4">
            <SubscribeForm />
          </div>
        </div>
      </div>
    </section>
  );
}
