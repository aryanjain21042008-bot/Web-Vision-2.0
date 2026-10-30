import { getStore } from "@netlify/blobs";
import { LINES } from "./metro-data.mjs";

const STEP = 0.04; // stations per second
const LEVELS = ["green", "yellow", "red"];
const STAFF = [["Ramesh Kumar", 442], ["Sunita Devi", 317], ["Imran Khan", 508], ["Mohan Lal", 261]];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const send = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const SAFE_ID = /^[A-Za-z0-9-]{3,24}$/;
// Incident status advances every 7 seconds after it is logged
const view = (o) => ({ ...o, step: Math.min(3, Math.floor((Date.now() - o.createdAt) / 7000)) });

// Train positions are a pure function of the clock: each train bounces end to end
function trains(now = Date.now()) {
  const out = {};
  for (const [k, L] of Object.entries(LINES)) {
    const m = L.stations.length - 1;
    out[k] = [0, 1, 2, 3].map((i) => {
      const s = ((i * 0.25 + 0.1) * 2 * m + (now / 1000) * STEP) % (2 * m);
      const fwd = s <= m;
      return { id: L.code + (101 + i), pos: fwd ? s : 2 * m - s, dir: fwd ? 1 : -1, crowd: LEVELS[(Math.floor(now / 30000) + i + k.length) % 3] };
    });
  }
  return out;
}

async function nextNumber(store, name) {
  const n = (await store.get(`count/${name}`, { type: "json" })) ?? 0;
  await store.setJSON(`count/${name}`, n + 1);
  return n;
}

export default async (req) => {
  const [, kind, id] = new URL(req.url).pathname.split("/").filter(Boolean); // /api/<kind>/<id>
  const store = getStore({ name: "dmrc", consistency: "strong" });
  try {
    if (req.method === "GET" && kind === "trains") return send(trains());

    if (req.method === "POST" && kind === "incidents") {
      const { line, station, coach, no, cat, photo } = await req.json().catch(() => ({}));
      const L = LINES[line];
      const i = L ? L.stations.indexOf(station) : -1;
      if (i < 0 || !coach || !cat) return send({ error: "Invalid incident report." }, 400);
      const n = await nextNumber(store, "incident");
      const o = { id: `DMRC-${9821 + n}`, line, station, coach: String(coach).slice(0, 40), no: String(no || "").slice(0, 3), cat: String(cat).slice(0, 60), photo: !!photo, next: L.stations[i + 1] || L.stations[i - 1], plat: pick([1, 2]), createdAt: Date.now() };
      await store.setJSON(`incident/${o.id}`, o);
      return send(view(o), 201);
    }
    if (req.method === "GET" && kind === "incidents" && SAFE_ID.test(id || "")) {
      const o = await store.get(`incident/${id}`, { type: "json" });
      return o ? send(view(o)) : send({ error: "Not found" }, 404);
    }

    if (req.method === "POST" && kind === "assistance") {
      const { station, gate, time, phone } = await req.json().catch(() => ({}));
      if (!Object.values(LINES).some((L) => L.stations.includes(station))) return send({ error: "Unknown station." }, 400);
      if (!/^\d{10}$/.test(String(phone))) return send({ error: "Enter a 10-digit mobile number." }, 400);
      const [name, sid] = pick(STAFF);
      const n = await nextNumber(store, "booking");
      const b = { ref: `WA-${10000 + n}`, station, gate: String(gate).slice(0, 20), time: String(time).slice(0, 5), phone, name, sid };
      await store.setJSON(`booking/${b.ref}`, b);
      return send(b, 201);
    }
    if (req.method === "GET" && kind === "assistance" && SAFE_ID.test(id || "")) {
      const b = await store.get(`booking/${id}`, { type: "json" });
      return b ? send(b) : send({ error: "Not found" }, 404);
    }
    return send({ error: "Not found" }, 404);
  } catch (err) {
    return send({ error: "Server error" }, 500);
  }
};

export const config = { path: "/api/*" };
