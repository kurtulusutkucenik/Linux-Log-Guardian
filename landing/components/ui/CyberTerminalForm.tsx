"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAudioKernel } from "@/context/AudioKernelContext";
import { CONTACT } from "@/lib/content";

type Step = "name" | "email" | "message" | "sent";

interface LogLine {
  kind: "info" | "success" | "error" | "prompt" | "input";
  text: string;
}

const PROMPT = "cenik@logguardian:~$";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const QUESTION: Record<Exclude<Step, "sent">, string> = {
  name: "Lütfen isminizi girin ve ENTER'a basın:",
  email: "E-posta adresinizi girin:",
  message: "Mesajınızı / teklif talebinizi yazın:",
};

/**
 * A living Linux terminal that stands in for the contact form. Keystrokes
 * click, inputs are validated with streaming syslog, and submit encodes the
 * payload to HEX before "transmitting".
 */
export default function CyberTerminalForm() {
  const { play } = useAudioKernel();
  const [step, setStep] = useState<Step>("name");
  const [value, setValue] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [lines, setLines] = useState<LogLine[]>([
    { kind: "info", text: "Linux Log Guardian secure contact shell v1.0" },
    { kind: "info", text: "type your answer, press ENTER to continue" },
    { kind: "prompt", text: QUESTION.name },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [caret, setCaret] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => setCaret((c) => !c), 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const push = (line: LogLine) => setLines((l) => [...l, line]);

  const hex = useMemo(
    () =>
      (s: string) =>
        Array.from(s)
          .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join(" "),
    []
  );

  const submit = (payload: typeof form) => {
    setStep("sent");
    push({ kind: "info", text: "encoding payload → HEX…" });
    const blob = `${payload.name}|${payload.email}|${payload.message}`;
    window.setTimeout(() => {
      push({ kind: "info", text: hex(blob).slice(0, 96) + " …" });
      play("warp");
    }, 260);
    window.setTimeout(() => {
      push({ kind: "success", text: "[SUCCESS] payload authenticated · TLS 1.3" });
    }, 620);
    window.setTimeout(() => {
      push({ kind: "success", text: "LOG GÖNDERİLDİ — 200 OK · teşekkürler!" });
      push({
        kind: "info",
        text: `yanıt için: ${CONTACT.email}`,
      });
    }, 1000);
  };

  const advance = () => {
    const v = value.trim();
    if (step === "sent") return;

    // echo the user input
    push({ kind: "input", text: `${PROMPT} ${v || "—"}` });

    if (step === "name") {
      if (!v) {
        push({ kind: "error", text: "[ERROR] isim boş olamaz" });
        play("error");
        return;
      }
      setForm((f) => ({ ...f, name: v }));
      push({ kind: "success", text: "[INFO] User input received: Name validated." });
      push({ kind: "prompt", text: QUESTION.email });
      setStep("email");
    } else if (step === "email") {
      if (!emailOk(v)) {
        push({ kind: "error", text: "[ERROR] geçersiz e-posta formatı" });
        play("error");
        return;
      }
      setForm((f) => ({ ...f, email: v }));
      push({ kind: "success", text: "[SUCCESS] Email string authenticated." });
      push({ kind: "prompt", text: QUESTION.message });
      setStep("message");
    } else if (step === "message") {
      if (v.length < 3) {
        push({ kind: "error", text: "[ERROR] mesaj çok kısa" });
        play("error");
        return;
      }
      const next = { ...form, message: v };
      setForm(next);
      push({ kind: "success", text: "[INFO] Message buffer sealed." });
      submit(next);
    }
    setValue("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      advance();
    } else if (e.key.length === 1) {
      play("type");
    }
  };

  const color: Record<LogLine["kind"], string> = {
    info: "text-slate-500",
    success: "text-[#e8eaed]",
    error: "text-[#ff4500]",
    prompt: "text-sky-300",
    input: "text-white",
  };

  return (
    <div
      className="interactive relative overflow-hidden rounded-2xl border border-[#e8eaed]/20 bg-black/70 shadow-[0_0_60px_-20px_rgba(232,234,237,0.4)]"
      onClick={() => inputRef.current?.focus()}
    >
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff4500]/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e8eaed]/60" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          secure-contact — kernel shell
        </span>
      </div>

      {/* scanline */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]">
        <div className="h-8 w-full animate-scanline bg-gradient-to-b from-transparent via-[#e8eaed] to-transparent" />
      </div>

      <div
        ref={scrollRef}
        className="h-72 space-y-1 overflow-y-auto px-4 py-4 font-mono text-[12px] leading-relaxed"
      >
        {lines.map((l, i) => (
          <div key={i} className={color[l.kind]}>
            {l.text}
          </div>
        ))}

        {step !== "sent" && (
          <div className="flex items-center text-white">
            <span className="mr-2 text-[#e8eaed]">{PROMPT}</span>
            <span className="break-all">{value}</span>
            <span
              className={`ml-0.5 inline-block h-4 w-2 bg-[#e8eaed] ${
                caret ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        )}
      </div>

      {/* invisible capture input */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Terminal iletişim girişi"
        className="absolute inset-x-0 bottom-0 h-10 w-full cursor-none bg-transparent px-4 font-mono text-transparent caret-transparent outline-none"
        autoComplete="off"
        spellCheck={false}
        disabled={step === "sent"}
      />
    </div>
  );
}
