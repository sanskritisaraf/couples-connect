"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

const PROMPTS = [
  (t: string) => `You're into ${t} too! Any favourite spots in town?`,
  (t: string) => `Okay, we need ${t} recommendations from you two.`,
  (t: string) => `Should we plan something around ${t} one weekend?`,
];

export function Chat({
  matchId, userId, names, initial, shared,
}: {
  matchId: string;
  userId: string;
  names: Record<string, { name: string; mine: boolean }>;
  initial: Message[];
  shared: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, matchId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(body: string) {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    setText("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: userId, body: trimmed })
      .select()
      .single<Message>();
    if (error) {
      setError(error.message);
      setText(trimmed);
      return;
    }
    setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, data]));
  }

  const ideas = shared.slice(0, 3).map((t, i) => PROMPTS[i % PROMPTS.length](t));

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="card text-center">
            <p className="font-display text-xl font-semibold">Break the ice</p>
            <p className="mt-1 text-sm text-muted">
              {shared.length ? `You have ${shared.length} things in common. Tap one to send it:` : "Say hello and suggest a plan."}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {(ideas.length ? ideas : ["Hi both! Would you be up for dinner sometime?"]).map((idea) => (
                <button key={idea} onClick={() => send(idea)} className="rounded-2xl border border-line bg-cream px-4 py-2.5 text-left text-sm hover:border-clay">
                  {idea}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const who = names[m.sender_id];
          const mine = who?.mine ?? false;
          const showName = i === 0 || messages[i - 1].sender_id !== m.sender_id;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {showName && (
                <span className="mb-1 px-2 text-xs font-semibold text-muted">
                  {m.sender_id === userId ? "You" : who?.name ?? "Someone"}
                </span>
              )}
              <p className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] ${
                m.sender_id === userId ? "bg-clay text-white" : mine ? "bg-clay/15" : "border border-line bg-white"
              }`}>
                {m.body}
              </p>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {error && <p className="pb-2 text-sm text-clay-dark">{error}</p>}
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2 border-t border-line pt-3">
        <input className="field rounded-full" placeholder="Message all four of you…" maxLength={2000}
          value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-primary" disabled={!text.trim()}>Send</button>
      </form>
    </>
  );
}
