import React, { useState, useEffect, useMemo } from "react";
import { Train, Route as RouteIcon, ShieldAlert, Accessibility, Camera, Phone, Clock, ArrowRight, CheckCircle2, X, Repeat, Users } from "lucide-react";

const Y = ["Samaypur Badli", "Kashmere Gate", "Chandni Chowk", "New Delhi", "Rajiv Chowk", "Central Secretariat", "INA", "Hauz Khas", "Millennium City Centre Gurugram"];
const B = ["Dwarka Sec 21", "Janakpuri West", "Rajouri Garden", "Rajiv Chowk", "Mandi House", "Yamuna Bank", "Botanical Garden", "Noida Electronic City"];
const LINES = {
  yellow: { label: "Yellow Line", hex: "#F2B705", stations: Y },
  blue: { label: "Blue Line", hex: "#1B5FC1", stations: B },
};
const ALL = [...new Set([...Y, ...B])];
const CROWD = { green: ["bg-green-500", "Light"], yellow: ["bg-yellow-400", "Moderate"], red: ["bg-red-600", "Crowded"] };
const STEP = 0.03; // stations per second
const ROW = 46;

const mkTrains = (k) =>
  [0.6, 3.2, 6.1].map((p, i) => ({ id: k[0].toUpperCase() + (101 + i), pos: p, dir: i === 1 ? -1 : 1, crowd: ["green", "yellow", "red"][i] }));
const fmt = (s) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
const linesOf = (n) => Object.keys(LINES).filter((k) => LINES[k].stations.includes(n));
const fare = (h) => 20 + 10 * Math.min(4, Math.floor((h - 1) / 3));
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

function plan(o, d) {
  if (!o || !d || o === d) return null;
  const common = linesOf(o).find((k) => linesOf(d).includes(k));
  const leg = (k, a, b) => {
    const s = LINES[k].stations, i = s.indexOf(a), j = s.indexOf(b);
    return { k, a, b, hops: Math.abs(i - j), toward: j > i ? s[s.length - 1] : s[0] };
  };
  const legs = common ? [leg(common, o, d)] : [leg(linesOf(o)[0], o, "Rajiv Chowk"), leg(linesOf(d)[0], "Rajiv Chowk", d)];
  const hops = legs.reduce((t, l) => t + l.hops, 0);
  return { legs, hops, inter: !common, fare: fare(hops), mins: Math.round(hops * 2.4) + (common ? 0 : 3) };
}

const cls = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600";
const Field = ({ label, children }) => (
  <label className="block mb-3">
    <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
    {children}
  </label>
);
const Sel = ({ value, onChange, options }) => (
  <select className={cls} value={value} onChange={(e) => onChange(e.target.value)}>
    {options.map((o) => <option key={o}>{o}</option>)}
  </select>
);

export default function DelhiMetroApp() {
  const [tab, setTab] = useState("track");
  const [line, setLine] = useState("yellow");
  const [trains, setTrains] = useState({ yellow: mkTrains("yellow"), blue: mkTrains("blue") });
  const [watch, setWatch] = useState("Rajiv Chowk");

  const [form, setForm] = useState({ line: "yellow", station: Y[0], coach: "Women's Reserved Coach", no: "3", cat: "Men sitting in Women's coach", photo: false });
  const [incident, setIncident] = useState(null);

  const [from, setFrom] = useState("Dwarka Sec 21");
  const [to, setTo] = useState("Hauz Khas");
  const route = useMemo(() => plan(from, to), [from, to]);

  const [modal, setModal] = useState(false);
  const [as, setAs] = useState({ station: "Rajiv Chowk", gate: "Gate 2", time: new Date().toTimeString().slice(0, 5), phone: "" });
  const [asErr, setAsErr] = useState("");
  const [pass, setPass] = useState(null);

  // Simulated telemetry
  useEffect(() => {
    const t = setInterval(() => {
      setTrains((all) => {
        const out = {};
        for (const k in all) {
          const max = LINES[k].stations.length - 1;
          out[k] = all[k].map((tr) => {
            let pos = tr.pos + tr.dir * STEP, dir = tr.dir;
            if (pos >= max) { pos = max; dir = -1; }
            if (pos <= 0) { pos = 0; dir = 1; }
            return { ...tr, pos, dir, crowd: Math.random() < 0.04 ? rnd(Object.keys(CROWD)) : tr.crowd };
          });
        }
        return out;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Incident status progression
  useEffect(() => {
    if (!incident || incident.step >= 3) return;
    const t = setTimeout(() => setIncident((i) => ({ ...i, step: i.step + 1 })), 7000);
    return () => clearTimeout(t);
  }, [incident?.id, incident?.step]);

  const L = LINES[line];
  const stIdx = L.stations.indexOf(watch);
  const watchOpts = L.stations;
  const eta = (dir) => {
    const c = trains[line].filter((t) => t.dir === dir && (stIdx - t.pos) * dir >= 0);
    if (!c.length) return null;
    return Math.ceil(Math.min(...c.map((t) => Math.abs(stIdx - t.pos))) / STEP);
  };

  const switchLine = (k) => { setLine(k); setWatch(LINES[k].stations.includes(watch) ? watch : LINES[k].stations[0]); };

  const submitIncident = (e) => {
    e.preventDefault();
    const s = LINES[form.line].stations, i = s.indexOf(form.station);
    setIncident({
      id: `DMRC-${Math.floor(1000 + Math.random() * 9000)}`,
      next: s[i + 1] || s[i - 1], plat: rnd([1, 2]), step: 0, ...form,
    });
  };
  const STATUS = ["Alert received", "Flying squad alerted", "En route to coach", "Team at coach"];

  const book = (e) => {
    e.preventDefault();
    if (as.phone.length !== 10) return setAsErr("Enter a 10-digit mobile number.");
    const a = rnd(["Ramesh Kumar", "Sunita Devi", "Imran Khan", "Mohan Lal"]);
    setPass({ ...as, name: a, sid: Math.floor(100 + Math.random() * 800), ref: `WA-${Math.floor(10000 + Math.random() * 89999)}` });
    setAsErr(""); setModal(false);
  };

  const tabs = [["track", "Track", Train], ["route", "Route", RouteIcon], ["safety", "Safety", ShieldAlert], ["assist", "Assistance", Accessibility]];

  return (
    <div className="min-h-screen w-full bg-slate-300 flex items-center justify-center sm:p-6">
      <div className="relative w-full sm:max-w-[390px] h-screen sm:h-[780px] bg-slate-50 sm:rounded-[44px] sm:border-[10px] border-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-red-700 text-white px-4 pt-5 pb-3 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold leading-tight">Delhi Metro</div>
            <div className="text-xs text-red-100">Yellow + Blue line demo</div>
          </div>
          <div className="flex gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full" style={{ background: LINES.blue.hex }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "track" && (
            <div>
              <div className="flex gap-2 mb-4">
                {Object.entries(LINES).map(([k, v]) => (
                  <button key={k} onClick={() => switchLine(k)} className={`flex-1 rounded-xl py-2.5 text-sm font-bold border-2 ${line === k ? "text-white border-transparent" : "bg-white text-slate-700 border-slate-200"}`}
                    style={line === k ? { background: v.hex, color: k === "yellow" ? "#1f1f1f" : "#fff" } : {}}>{v.label}</button>
                ))}
              </div>
              <Field label="Your station"><Sel value={watch} onChange={setWatch} options={watchOpts} /></Field>
              {[1, -1].map((d) => {
                const s = eta(d), end = L.stations[d === 1 ? L.stations.length - 1 : 0];
                return (
                  <div key={d} className="bg-white rounded-2xl border border-slate-200 p-3 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex flex-col items-center justify-center text-[10px] leading-none"><span>PF</span><span className="text-base font-bold">{d === 1 ? 1 : 2}</span></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500">Towards</div>
                      <div className="text-sm font-semibold truncate">{end}</div>
                    </div>
                    <div className="text-right">
                      {s === null ? <span className="text-xs text-slate-500">No train soon</span> : (<>
                        <div className="text-lg font-bold text-red-700 tabular-nums">{s <= 5 ? "Arriving" : fmt(s)}</div>
                        <div className="text-[11px] text-slate-500">Platform {d === 1 ? 1 : 2}</div></>)}
                    </div>
                  </div>
                );
              })}
              <div className="text-sm font-bold mt-4 mb-2">Live line map</div>
              <div className="bg-white rounded-2xl border border-slate-200 p-3">
                <div className="relative" style={{ height: L.stations.length * ROW }}>
                  <div className="absolute w-1.5 rounded-full" style={{ left: 21, top: ROW / 2, bottom: ROW / 2, background: L.hex }} />
                  {L.stations.map((s, i) => (
                    <div key={s} className="absolute left-0 right-0 flex items-center" style={{ top: i * ROW, height: ROW }}>
                      <span className="w-4 h-4 rounded-full bg-white border-[3px] ml-3.5 z-10" style={{ borderColor: s === "Rajiv Chowk" ? "#B91C1C" : L.hex }} />
                      <span className={`ml-5 text-sm ${s === watch ? "font-bold text-red-700" : "text-slate-700"}`}>{s}</span>
                      {s === "Rajiv Chowk" && <span className="ml-2 text-[10px] bg-red-100 text-red-700 rounded px-1.5 py-0.5 font-semibold">Interchange</span>}
                    </div>
                  ))}
                  {trains[line].map((t) => (
                    <div key={t.id} className={`absolute z-20 w-7 h-7 rounded-full border-2 border-white shadow flex items-center justify-center text-white ${CROWD[t.crowd][0]}`}
                      style={{ left: 10, top: t.pos * ROW + ROW / 2 - 14, transition: "top 1s linear" }}><Train size={14} /></div>
                  ))}
                </div>
                <div className="border-t border-slate-100 pt-2 mt-1 space-y-1">
                  {trains[line].map((t) => (
                    <div key={t.id} className="flex items-center text-xs text-slate-700">
                      <span className={`w-2.5 h-2.5 rounded-full mr-2 ${CROWD[t.crowd][0]}`} />
                      <span className="font-semibold w-12">{t.id}</span>
                      <span className="flex-1 truncate">to {L.stations[t.dir === 1 ? L.stations.length - 1 : 0]}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{CROWD[t.crowd][1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "route" && (
            <div>
              <Field label="From"><Sel value={from} onChange={setFrom} options={ALL} /></Field>
              <Field label="To"><Sel value={to} onChange={setTo} options={ALL} /></Field>
              {!route ? <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3">Pick two different stations to see a route.</div> : (
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${route.inter ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800"}`}>{route.inter ? "Interchange route" : "Direct route"}</span>
                    <span className="text-2xl font-bold">₹{route.fare}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    {[["Time", `${route.mins} min`], ["Stations", route.hops], ["Changes", route.inter ? 1 : 0]].map(([a, b]) => (
                      <div key={a} className="bg-slate-50 rounded-xl py-2"><div className="text-base font-bold">{b}</div><div className="text-[11px] text-slate-500">{a}</div></div>
                    ))}
                  </div>
                  {route.legs.map((l, i) => (
                    <div key={i}>
                      <div className="flex gap-3">
                        <div className="w-1.5 rounded-full shrink-0" style={{ background: LINES[l.k].hex }} />
                        <div className="pb-3 text-sm">
                          <div className="font-semibold">{LINES[l.k].label} towards {l.toward}</div>
                          <div className="text-slate-600 flex items-center gap-1 flex-wrap">{l.a} <ArrowRight size={12} /> {l.b}</div>
                          <div className="text-xs text-slate-500">{l.hops} stations, about {Math.round(l.hops * 2.4)} min</div>
                        </div>
                      </div>
                      {i === 0 && route.inter && (
                        <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 mb-3"><Repeat size={14} />Change platforms at Rajiv Chowk: about 3 min walk</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "safety" && (
            <div>
              {incident && (
                <div className="mb-4">
                  <div className="rounded-xl bg-red-700 text-white text-sm p-3 mb-2">
                    Incident #{incident.id} logged. Dispatched to CISF Quick Response Team at {incident.next} Platform {incident.plat}. Flying squad alerted.
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm">{incident.id}</span>
                      <span className={`text-xs font-bold rounded-full px-2 py-1 ${incident.step === 3 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>{STATUS[incident.step]}</span>
                    </div>
                    <div className="text-xs text-slate-600 mb-2">{incident.cat}, {incident.coach} #{incident.no}, {incident.station} ({LINES[incident.line].label}){incident.photo ? ", photo attached" : ""}</div>
                    <div className="flex gap-1">{STATUS.map((s, i) => <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= incident.step ? "bg-red-600" : "bg-slate-200"}`} />)}</div>
                  </div>
                </div>
              )}
              <form onSubmit={submitIncident}>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Line"><Sel value={LINES[form.line].label} onChange={(v) => { const k = v === "Yellow Line" ? "yellow" : "blue"; setForm({ ...form, line: k, station: LINES[k].stations[0] }); }} options={["Yellow Line", "Blue Line"]} /></Field>
                  <Field label="Coach number"><Sel value={form.no} onChange={(v) => setForm({ ...form, no: v })} options={["1", "2", "3", "4", "5", "6", "7", "8"]} /></Field>
                </div>
                <Field label="Current station"><Sel value={form.station} onChange={(v) => setForm({ ...form, station: v })} options={LINES[form.line].stations} /></Field>
                <Field label="Coach type"><Sel value={form.coach} onChange={(v) => setForm({ ...form, coach: v })} options={["Women's Reserved Coach", "General"]} /></Field>
                <Field label="Incident category"><Sel value={form.cat} onChange={(v) => setForm({ ...form, cat: v })} options={["Men sitting in Women's coach", "Harassment", "Pickpocketing", "Medical Emergency"]} /></Field>
                <button type="button" onClick={() => setForm({ ...form, photo: !form.photo })} className={`w-full mb-3 rounded-xl border-2 border-dashed py-2.5 text-sm font-semibold flex items-center justify-center gap-2 ${form.photo ? "border-green-600 text-green-700 bg-green-50" : "border-slate-300 text-slate-600"}`}>
                  {form.photo ? <><CheckCircle2 size={16} />photo_evidence.jpg attached</> : <><Camera size={16} />Snap photo / mock upload</>}
                </button>
                <button type="submit" className="w-full rounded-xl bg-red-700 text-white font-bold py-3 flex items-center justify-center gap-2"><ShieldAlert size={18} />Report incident</button>
              </form>
            </div>
          )}

          {tab === "assist" && (
            <div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
                <div className="font-bold mb-1">Wheelchair and special assistance</div>
                <p className="text-sm text-slate-600 mb-3">Book a station attendant and wheelchair waiting for you at your arrival gate.</p>
                <button onClick={() => setModal(true)} className="w-full rounded-xl bg-blue-700 text-white font-bold py-3">Book assistance</button>
              </div>
              {pass && (
                <div className="rounded-2xl border-2 border-green-600 bg-white overflow-hidden">
                  <div className="bg-green-600 text-white px-4 py-2 flex justify-between text-sm font-bold"><span>Assistance pass</span><span>{pass.ref}</span></div>
                  <div className="p-4 text-sm space-y-1.5">
                    <div className="flex items-center gap-2 text-green-700 font-semibold"><CheckCircle2 size={16} />Wheelchair ready at {pass.gate}</div>
                    <div><span className="text-slate-500">Station:</span> {pass.station}</div>
                    <div className="flex items-center gap-1"><Clock size={14} className="text-slate-500" /> Arrival {pass.time}</div>
                    <div><span className="text-slate-500">Attendant:</span> {pass.name} - Staff ID #{pass.sid}</div>
                    <a href="tel:155370" className="mt-2 w-full rounded-xl bg-slate-900 text-white font-semibold py-2.5 flex items-center justify-center gap-2"><Phone size={16} />Contact attendant</a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {modal && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-end">
            <form onSubmit={book} className="w-full bg-white rounded-t-3xl p-5 max-h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-lg">Book assistance</div>
                <button type="button" aria-label="Close" onClick={() => setModal(false)}><X /></button>
              </div>
              <Field label="Station"><Sel value={as.station} onChange={(v) => setAs({ ...as, station: v })} options={ALL} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Arrival gate"><Sel value={as.gate} onChange={(v) => setAs({ ...as, gate: v })} options={["Gate 1", "Gate 2", "Gate 3", "Gate 4"]} /></Field>
                <Field label="Arrival time"><input type="time" className={cls} value={as.time} onChange={(e) => setAs({ ...as, time: e.target.value })} required /></Field>
              </div>
              <Field label="Passenger phone number"><input inputMode="numeric" placeholder="10-digit mobile" className={cls} value={as.phone} onChange={(e) => setAs({ ...as, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} /></Field>
              {asErr && <div className="text-sm text-red-700 mb-2">{asErr}</div>}
              <button type="submit" className="w-full rounded-xl bg-blue-700 text-white font-bold py-3">Confirm booking</button>
            </form>
          </div>
        )}

        <nav className="grid grid-cols-4 bg-white border-t border-slate-200">
          {tabs.map(([k, n, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className={`py-2.5 flex flex-col items-center gap-0.5 text-[11px] font-semibold ${tab === k ? "text-red-700" : "text-slate-500"}`}>
              <Icon size={20} />{n}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
