import { DRINKS_LABEL, KIDS_LABEL, yearsTogether } from "@/lib/constants";
import type { DiscoverCouple } from "@/lib/types";

function Tags({ title, all, shared }: { title: string; all: string[]; shared: string[] }) {
  if (!all.length) return null;
  const sorted = [...shared, ...all.filter((t) => !shared.includes(t))];
  return (
    <div>
      <p className="label">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((t) => (
          <span key={t} className={`chip ${shared.includes(t) ? "border-sage bg-sage text-white" : "border-line text-muted"}`}>
            {shared.includes(t) && "✓ "}{t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CoupleCard({ c }: { c: DiscoverCouple }) {
  const facts = [
    yearsTogether(c.together_since),
    c.drinks ? DRINKS_LABEL[c.drinks] : null,
    c.kids ? KIDS_LABEL[c.kids] : null,
  ].filter(Boolean);
  const highlights = [...c.shared_cuisines, ...c.shared_activities, ...c.shared_music, ...c.shared_movies].slice(0, 3);

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-white">
      <div className="relative aspect-[4/3] bg-sand">
        {c.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.photo_url} alt={c.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-6xl text-clay/40">
            {c.name.split(/\s*&\s*/).map((n) => n[0]).join(" & ")}
          </div>
        )}
        {c.shared_count > 0 && (
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-sage shadow">
            {c.shared_count} thing{c.shared_count === 1 ? "" : "s"} in common
          </span>
        )}
      </div>
      <div className="space-y-4 p-6">
        <div>
          <h2 className="font-display text-3xl font-semibold">{c.name}</h2>
          <p className="text-sm text-muted">
            {[c.neighbourhood, c.city].filter(Boolean).join(", ")}
            {facts.length > 0 && " · " + facts.join(" · ")}
          </p>
        </div>
        {highlights.length > 0 && (
          <p className="rounded-2xl bg-sage/10 px-4 py-3 text-sm text-sage">
            You both love <b>{highlights.join(", ")}</b>.
          </p>
        )}
        {c.bio && <p className="text-[15px] leading-relaxed">{c.bio}</p>}
        <Tags title="Food" all={c.cuisines} shared={c.shared_cuisines} />
        <Tags title="Things they do" all={c.activities} shared={c.shared_activities} />
        <Tags title="Music" all={c.music} shared={c.shared_music} />
        <Tags title="Movies & shows" all={c.movies} shared={c.shared_movies} />
      </div>
    </article>
  );
}
