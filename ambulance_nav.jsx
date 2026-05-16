import { useState, useEffect, useRef, useCallback } from "react";

const HOSPITALS = [
  { id: 1, name: "RS Cipto Mangunkusumo", coords: [106.8456 - 0.03, -6.1972], type: "hospital" },
  { id: 2, name: "RS Fatmawati", coords: [106.7937, -6.2924], type: "hospital" },
  { id: 3, name: "RS Harapan Kita", coords: [106.8823, -6.1845], type: "hospital" },
];

const AMBULANCE_START = { coords: [106.8456, -6.2088], label: "Lokasi Pasien" };

const TRAFFIC_LIGHTS = [
  { id: "tl1", coords: [106.834, -6.21], road: "Jl. Sudirman" },
  { id: "tl2", coords: [106.822, -6.215], road: "Jl. Gatot Subroto" },
  { id: "tl3", coords: [106.815, -6.218], road: "Jl. Slipi" },
  { id: "tl4", coords: [106.838, -6.205], road: "Jl. Thamrin" },
  { id: "tl5", coords: [106.828, -6.208], road: "Jl. Kebon Sirih" },
];

const TRAFFIC_SEGMENTS = [
  { id: "seg1", from: [106.8456, -6.2088], to: [106.838, -6.205], congestion: "heavy" },
  { id: "seg2", from: [106.838, -6.205], to: [106.834, -6.21], congestion: "moderate" },
  { id: "seg3", from: [106.834, -6.21], to: [106.828, -6.208], congestion: "clear" },
  { id: "seg4", from: [106.828, -6.208], to: [106.822, -6.215], congestion: "clear" },
  { id: "seg5", from: [106.822, -6.215], to: [106.815, -6.218], congestion: "moderate" },
  { id: "seg6", from: [106.815, -6.218], to: [106.7937, -6.2924], congestion: "clear" },
];

function geoToSvg(lon, lat, bounds, width, height) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width;
  const y = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (height * -1) + height;
  return [x, y];
}

const BOUNDS = { minLon: 106.77, maxLon: 106.91, minLat: -6.31, maxLat: -6.17 };
const SVG_W = 680, SVG_H = 440;

function congestionColor(c, active) {
  if (active) return "#22c55e";
  if (c === "heavy") return "#ef4444";
  if (c === "moderate") return "#f59e0b";
  return "#22c55e";
}

function congestionLabel(c) {
  if (c === "heavy") return "Macet Berat";
  if (c === "moderate") return "Sedang";
  return "Lancar";
}

function TrafficLightIcon({ x, y, state }) {
  const body = state === "green" ? "#16a34a" : state === "red" ? "#dc2626" : "#ca8a04";
  const glow = state === "green" ? "#86efac" : state === "red" ? "#fca5a5" : "#fde68a";
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-7} y={-18} width={14} height={32} rx={3} fill="#1e293b" />
      <circle cx={0} cy={-11} r={4} fill={state === "red" ? "#ef4444" : "#334155"} />
      <circle cx={0} cy={0} r={4} fill={state === "yellow" ? "#f59e0b" : "#334155"} />
      <circle cx={0} cy={11} r={4} fill={state === "green" ? "#22c55e" : "#334155"} />
      {state === "green" && <circle cx={0} cy={11} r={6} fill={glow} opacity={0.4} />}
      {state === "red" && <circle cx={0} cy={-11} r={6} fill={glow} opacity={0.4} />}
    </g>
  );
}

export default function AmbulanceNav() {
  const [active, setActive] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [tlState, setTlState] = useState({});
  const [ambulancePos, setAmbulancePos] = useState(0);
  const [eta, setEta] = useState(null);
  const [log, setLog] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const animRef = useRef(null);
  const elapsedRef = useRef(null);

  const nearest = HOSPITALS[1]; // Fatmawati as nearest for demo

  const addLog = useCallback((msg, type = "info") => {
    setLog(prev => [{ msg, type, t: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }, ...prev].slice(0, 12));
  }, []);

  function startEmergency() {
    setActive(true);
    setSelectedHospital(nearest);
    setAmbulancePos(0);
    setElapsed(0);
    setEta(12);
    const newTl = {};
    TRAFFIC_LIGHTS.forEach(tl => { newTl[tl.id] = "green"; });
    setTlState(newTl);
    addLog("🚨 MODE DARURAT DIAKTIFKAN", "danger");
    addLog(`Tujuan: ${nearest.name}`, "info");
    addLog("Semua lampu lalu lintas → HIJAU", "success");
    addLog("Estimasi tiba: 12 menit", "info");

    let pos = 0;
    let secs = 0;
    clearInterval(animRef.current);
    clearInterval(elapsedRef.current);
    animRef.current = setInterval(() => {
      pos += 1.2;
      if (pos >= 100) { pos = 100; clearInterval(animRef.current); addLog("✅ Ambulans tiba di rumah sakit!", "success"); }
      setAmbulancePos(pos);
      setEta(prev => prev > 0 ? Math.max(0, prev - 0.1) : 0);
    }, 300);
    elapsedRef.current = setInterval(() => {
      secs += 1;
      setElapsed(secs);
    }, 1000);
  }

  function stopEmergency() {
    setActive(false);
    setSelectedHospital(null);
    setAmbulancePos(0);
    setEta(null);
    setTlState({});
    setLog([]);
    setElapsed(0);
    clearInterval(animRef.current);
    clearInterval(elapsedRef.current);
  }

  useEffect(() => () => { clearInterval(animRef.current); clearInterval(elapsedRef.current); }, []);

  function interpRoute(t) {
    const route = TRAFFIC_SEGMENTS;
    const total = route.length;
    const segIdx = Math.min(Math.floor(t / 100 * total), total - 1);
    const seg = route[segIdx];
    const segT = (t / 100 * total) - segIdx;
    const lon = seg.from[0] + (seg.to[0] - seg.from[0]) * segT;
    const lat = seg.from[1] + (seg.to[1] - seg.from[1]) * segT;
    return [lon, lat];
  }

  const ambCoords = active ? interpRoute(ambulancePos) : AMBULANCE_START.coords;
  const [ambX, ambY] = geoToSvg(ambCoords[0], ambCoords[1], BOUNDS, SVG_W, SVG_H);

  const routePoints = TRAFFIC_SEGMENTS.map(s => {
    const [x1, y1] = geoToSvg(s.from[0], s.from[1], BOUNDS, SVG_W, SVG_H);
    return `${x1},${y1}`;
  }).join(" ") + " " + (() => { const [x, y] = geoToSvg(TRAFFIC_SEGMENTS[TRAFFIC_SEGMENTS.length - 1].to[0], TRAFFIC_SEGMENTS[TRAFFIC_SEGMENTS.length - 1].to[1], BOUNDS, SVG_W, SVG_H); return `${x},${y}`; })();

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "var(--color-background-primary)", color: "var(--color-text-primary)", minHeight: "100vh", padding: "1rem" }}>
      <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 1rem", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ background: "#dc2626", color: "#fff", borderRadius: 6, padding: "2px 10px", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>AMBULANS</span>
        Sistem Navigasi Darurat — Jakarta
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, alignItems: "start" }}>
        {/* MAP */}
        <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden", background: "#f0f4f0", position: "relative" }}>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: "block" }}>
            {/* Grid background */}
            <rect width={SVG_W} height={SVG_H} fill="#e8efe8" />
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 44} x2={SVG_W} y2={i * 44} stroke="#d4ddd4" strokeWidth={0.5} />
            ))}
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 43} y1={0} x2={i * 43} y2={SVG_H} stroke="#d4ddd4" strokeWidth={0.5} />
            ))}

            {/* Road-like blocks */}
            <rect x={40} y={60} width={580} height={8} rx={2} fill="#c8d5c8" opacity={0.6} />
            <rect x={40} y={180} width={580} height={8} rx={2} fill="#c8d5c8" opacity={0.6} />
            <rect x={40} y={300} width={580} height={8} rx={2} fill="#c8d5c8" opacity={0.6} />
            <rect x={120} y={40} width={8} height={380} rx={2} fill="#c8d5c8" opacity={0.6} />
            <rect x={280} y={40} width={8} height={380} rx={2} fill="#c8d5c8" opacity={0.6} />
            <rect x={460} y={40} width={8} height={380} rx={2} fill="#c8d5c8" opacity={0.6} />

            {/* Traffic segments */}
            {TRAFFIC_SEGMENTS.map(seg => {
              const [x1, y1] = geoToSvg(seg.from[0], seg.from[1], BOUNDS, SVG_W, SVG_H);
              const [x2, y2] = geoToSvg(seg.to[0], seg.to[1], BOUNDS, SVG_W, SVG_H);
              const col = congestionColor(seg.congestion, active);
              return (
                <g key={seg.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={active ? 7 : 5} strokeLinecap="round" opacity={0.85} />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={1.5} strokeDasharray="8 6" opacity={0.5} />
                </g>
              );
            })}

            {/* Traffic lights */}
            {TRAFFIC_LIGHTS.map(tl => {
              const [tx, ty] = geoToSvg(tl.coords[0], tl.coords[1], BOUNDS, SVG_W, SVG_H);
              const state = tlState[tl.id] || "red";
              return (
                <g key={tl.id}>
                  <TrafficLightIcon x={tx} y={ty} state={state} />
                  <text x={tx + 10} y={ty - 8} fontSize={9} fill="#334155" fontWeight={500}>{tl.road}</text>
                </g>
              );
            })}

            {/* Hospitals */}
            {HOSPITALS.map(h => {
              const [hx, hy] = geoToSvg(h.coords[0], h.coords[1], BOUNDS, SVG_W, SVG_H);
              const isTarget = selectedHospital?.id === h.id;
              return (
                <g key={h.id}>
                  <circle cx={hx} cy={hy} r={isTarget ? 14 : 10} fill={isTarget ? "#dc2626" : "#fff"} stroke={isTarget ? "#991b1b" : "#6b7280"} strokeWidth={2} />
                  <text x={hx} y={hy + 1} fontSize={10} fill={isTarget ? "#fff" : "#374151"} textAnchor="middle" dominantBaseline="middle" fontWeight={700}>🏥</text>
                  <rect x={hx + 16} y={hy - 10} width={h.name.length * 5.5} height={16} rx={3} fill="rgba(255,255,255,0.92)" />
                  <text x={hx + 20} y={hy + 2} fontSize={9} fill={isTarget ? "#dc2626" : "#374151"} fontWeight={isTarget ? 700 : 400}>{h.name}</text>
                </g>
              );
            })}

            {/* Ambulance */}
            <g transform={`translate(${ambX},${ambY})`}>
              {active && <circle cx={0} cy={0} r={18} fill="#fef08a" opacity={0.5}>
                <animate attributeName="r" values="14;22;14" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.2s" repeatCount="indefinite" />
              </circle>}
              <circle cx={0} cy={0} r={12} fill={active ? "#dc2626" : "#2563eb"} stroke="#fff" strokeWidth={2} />
              <text x={0} y={1} fontSize={12} textAnchor="middle" dominantBaseline="middle">🚑</text>
            </g>

            {/* Start label */}
            {(() => {
              const [sx, sy] = geoToSvg(AMBULANCE_START.coords[0], AMBULANCE_START.coords[1], BOUNDS, SVG_W, SVG_H);
              return (
                <g>
                  <circle cx={sx} cy={sy} r={5} fill="#7c3aed" stroke="#fff" strokeWidth={1.5} />
                  <text x={sx + 8} y={sy - 4} fontSize={9} fill="#7c3aed" fontWeight={600}>Lokasi Pasien</text>
                </g>
              );
            })()}

            {/* Legend */}
            <rect x={8} y={SVG_H - 68} width={160} height={62} rx={6} fill="rgba(255,255,255,0.9)" stroke="#d1d5db" strokeWidth={0.5} />
            <text x={16} y={SVG_H - 52} fontSize={9} fontWeight={600} fill="#374151">Kondisi Jalan</text>
            {[["#ef4444", "Macet Berat"], ["#f59e0b", "Arus Sedang"], ["#22c55e", "Lancar"]].map(([col, lbl], i) => (
              <g key={lbl}>
                <rect x={16} y={SVG_H - 44 + i * 14} width={20} height={7} rx={2} fill={col} />
                <text x={42} y={SVG_H - 38 + i * 14} fontSize={9} fill="#374151">{lbl}</text>
              </g>
            ))}
          </svg>

          {active && (
            <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", background: "#dc2626", color: "#fff", borderRadius: 20, padding: "4px 16px", fontSize: 12, fontWeight: 700, letterSpacing: 1, animation: "pulse 1s infinite", boxShadow: "0 2px 12px rgba(220,38,38,0.4)" }}>
              🚨 DARURAT AKTIF
            </div>
          )}
        </div>

        {/* PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Status Cards */}
          {active && (
            <>
              <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "12px 14px", border: "0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>ETA</div>
                <div style={{ fontSize: 26, fontWeight: 500, color: "#dc2626" }}>{Math.ceil(eta)} <span style={{ fontSize: 13, fontWeight: 400 }}>menit</span></div>
              </div>
              <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "12px 14px", border: "0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>Progress</div>
                <div style={{ height: 6, background: "var(--color-border-tertiary)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${ambulancePos}%`, background: "#22c55e", borderRadius: 3, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>{Math.round(ambulancePos)}% selesai</div>
              </div>
              <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "12px 14px", border: "0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>Waktu berjalan</div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{Math.floor(elapsed / 60).toString().padStart(2, "0")}:{(elapsed % 60).toString().padStart(2, "0")}</div>
              </div>
            </>
          )}

          {/* Traffic Light Status */}
          <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "12px 14px", border: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Lampu Lalu Lintas</div>
            {TRAFFIC_LIGHTS.map(tl => {
              const state = tlState[tl.id] || "red";
              return (
                <div key={tl.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: state === "green" ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "var(--color-text-secondary)", lineHeight: 1.3 }}>{tl.road}</span>
                  <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 600, color: state === "green" ? "#16a34a" : "#dc2626" }}>{state === "green" ? "HIJAU" : "MERAH"}</span>
                </div>
              );
            })}
          </div>

          {/* Route info */}
          <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "12px 14px", border: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Kondisi Jalur</div>
            {TRAFFIC_SEGMENTS.slice(0, 4).map(seg => (
              <div key={seg.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{ width: 28, height: 5, borderRadius: 2, background: congestionColor(seg.congestion, active), flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, color: "var(--color-text-secondary)" }}>{congestionLabel(seg.congestion)}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          {!active ? (
            <button onClick={startEmergency} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 }}>
              🚨 AKTIFKAN DARURAT
            </button>
          ) : (
            <button onClick={stopEmergency} style={{ background: "transparent", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>
              ✕ Batalkan
            </button>
          )}
        </div>
      </div>

      {/* Activity Log */}
      {log.length > 0 && (
        <div style={{ marginTop: 12, border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ background: "var(--color-background-secondary)", padding: "8px 14px", fontSize: 12, fontWeight: 500, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            Log Aktivitas
          </div>
          <div style={{ maxHeight: 140, overflowY: "auto", padding: "8px 14px" }}>
            {log.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 4, fontSize: 11.5, alignItems: "flex-start" }}>
                <span style={{ color: "var(--color-text-tertiary)", flexShrink: 0, fontFamily: "monospace" }}>{l.t}</span>
                <span style={{ color: l.type === "danger" ? "#dc2626" : l.type === "success" ? "#16a34a" : "var(--color-text-secondary)" }}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        button:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}
