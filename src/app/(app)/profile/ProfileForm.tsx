"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CITIES, INTERESTS, INTEREST_KEYS, type InterestKey } from "@/lib/constants";
import type { Couple } from "@/lib/types";

export function ProfileForm({
  couple, myName, myBirthYear, userId,
}: { couple: Couple; myName: string; myBirthYear: number | null; userId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: couple.name,
    bio: couple.bio ?? "",
    how_we_met: couple.how_we_met ?? "",
    city: couple.city ?? "",
    neighbourhood: couple.neighbourhood ?? "",
    together_since: couple.together_since ?? "",
    drinks: couple.drinks ?? "",
    kids: couple.kids ?? "",
  });
  const [tags, setTags] = useState<Record<InterestKey, string[]>>({
    cuisines: couple.cuisines, music: couple.music, movies: couple.movies, activities: couple.activities,
  });
  const [name, setName] = useState(myName);
  const [birthYear, setBirthYear] = useState(myBirthYear ? String(myBirthYear) : "");
  const thisYear = new Date().getFullYear();
  const [photoUrl, setPhotoUrl] = useState(couple.photo_url);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  function toggle(key: InterestKey, value: string) {
    const cur = tags[key];
    setTags({ ...tags, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setStatus({ ok: false, msg: "Photo must be under 5 MB." });
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${couple.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("couple-photos").upload(path, file, { contentType: file.type });
    if (error) {
      setUploading(false);
      return setStatus({ ok: false, msg: error.message });
    }
    const { data } = supabase.storage.from("couple-photos").getPublicUrl(path);
    const { error: e2 } = await supabase.from("couples").update({ photo_url: data.publicUrl }).eq("id", couple.id);
    setUploading(false);
    if (e2) return setStatus({ ok: false, msg: e2.message });
    setPhotoUrl(data.publicUrl);
    setStatus({ ok: true, msg: "Photo updated." });
    router.refresh();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const supabase = createClient();
    const [{ error }, { error: e2 }] = await Promise.all([
      supabase
        .from("couples")
        .update({
          name: form.name.trim(),
          bio: form.bio.trim() || null,
          how_we_met: form.how_we_met.trim() || null,
          city: form.city.trim() || null,
          neighbourhood: form.neighbourhood.trim() || null,
          together_since: form.together_since || null,
          drinks: form.drinks || null,
          kids: form.kids || null,
          ...tags,
        })
        .eq("id", couple.id),
      supabase
        .from("profiles")
        .update({ display_name: name.trim(), birth_year: birthYear ? Number(birthYear) : null })
        .eq("id", userId),
    ]);
    setBusy(false);
    const err = error ?? e2;
    setStatus(err ? { ok: false, msg: err.message } : { ok: true, msg: "Saved." });
    if (!err) router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="card flex flex-col items-center gap-5 sm:flex-row">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-sand">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl">📷</div>
          )}
        </div>
        <div className="text-center sm:text-left">
          <p className="font-semibold">A photo of the two of you</p>
          <p className="text-sm text-muted">Couples with a joint photo get far more likes.</p>
          <label className="btn-ghost mt-3 cursor-pointer">
            {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadPhoto} disabled={uploading} />
          </label>
        </div>
      </section>

      <section className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="cname">Couple name</label>
          <input id="cname" className="field" required minLength={2} maxLength={60} value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="label" htmlFor="myname">Your first name</label>
          <input id="myname" className="field" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="by">Your birth year</label>
          <input id="by" type="number" inputMode="numeric" className="field" min={thisYear - 80} max={thisYear - 18}
            placeholder="e.g. 1997" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} />
          <p className="mt-1 text-xs text-muted">Only your age is shown, e.g. &ldquo;{name || "You"}, 29&rdquo;.</p>
        </div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <input id="city" className="field" list="cities" required value={form.city} onChange={set("city")} placeholder="Delhi" />
          <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="label" htmlFor="hood">Neighbourhood</label>
          <input id="hood" className="field" maxLength={60} value={form.neighbourhood} onChange={set("neighbourhood")} placeholder="e.g. Hauz Khas" />
        </div>
        <div>
          <label className="label" htmlFor="since">Together since</label>
          <input id="since" type="date" className="field" value={form.together_since} onChange={set("together_since")} max={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="drinks">Drinks</label>
            <select id="drinks" className="field" value={form.drinks} onChange={set("drinks")}>
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="sometimes">Sometimes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="kids">Kids</label>
            <select id="kids" className="field" value={form.kids} onChange={set("kids")}>
              <option value="">—</option>
              <option value="none">No kids</option>
              <option value="have_kids">Have kids</option>
              <option value="expecting">Expecting</option>
              <option value="prefer_not_say">Prefer not to say</option>
            </select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="bio">About us</label>
          <textarea id="bio" className="field min-h-24" maxLength={600} value={form.bio} onChange={set("bio")}
            placeholder="What's a perfect Saturday for the two of you?" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="met">How we met</label>
          <textarea id="met" className="field min-h-16" maxLength={400} value={form.how_we_met} onChange={set("how_we_met")} />
        </div>
      </section>

      {INTEREST_KEYS.map((key) => (
        <section key={key} className="card">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold">{INTERESTS[key].label}</h2>
            <span className="text-xs text-muted">{tags[key].length} picked</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {INTERESTS[key].options.map((opt) => {
              const on = tags[key].includes(opt);
              return (
                <button key={opt} type="button" onClick={() => toggle(key, opt)} aria-pressed={on}
                  className={`chip ${on ? "border-clay bg-clay text-white" : "border-line bg-cream text-ink hover:border-ink"}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <div className="sticky bottom-20 z-10 flex items-center gap-4 rounded-full border border-line bg-white/95 p-2 pl-5 shadow-lg backdrop-blur md:bottom-4">
        <p className={`flex-1 text-sm ${status ? (status.ok ? "text-sage" : "text-clay-dark") : "text-muted"}`}>
          {status?.msg ?? "Both of you can edit this profile."}
        </p>
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
      </div>
    </form>
  );
}
