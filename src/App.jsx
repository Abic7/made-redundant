import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

function useIsMobile(breakpoint = 768) {
  return useSyncExternalStore(
    cb => { window.addEventListener("resize", cb); return () => window.removeEventListener("resize", cb); },
    () => window.innerWidth < breakpoint,
    () => false,
  );
}

// ─────────────────────────────────────────────────────────────
//  CONFIG — set VITE_SHEET_ID and VITE_GOOGLE_API_KEY in
//  Vercel environment variables (never commit real keys)
// ─────────────────────────────────────────────────────────────
const SHEET_ID    = import.meta.env.VITE_SHEET_ID    || "";
const API_KEY     = import.meta.env.VITE_GOOGLE_API_KEY || "";
const SHEET_NAME  = "Sheet1";
const LINKEDIN_URL = "https://www.linkedin.com/in/abichaudhuri/";

// ─────────────────────────────────────────────────────────────
//  SEED DATA
// ─────────────────────────────────────────────────────────────
const SEED_DATA = [
  { company:"Amazon",            industry:"E-commerce / Cloud",   country:"USA",        region:"North America", date:"2026-02", headcount:16000, aiConfidence:"genuine",     quote:"Flattening management layers, bolstering AI infrastructure" },
  { company:"Block",             industry:"Fintech",              country:"USA",        region:"North America", date:"2026-02", headcount:4000,  aiConfidence:"genuine",     quote:"AI tools accelerate company productivity" },
  { company:"WiseTech Global",   industry:"Logistics Software",   country:"Australia",  region:"Asia-Pacific",  date:"2026-02", headcount:2000,  aiConfidence:"genuine",     quote:"Advances in generative AI dramatically increasing software engineering productivity" },
  { company:"Atlassian",         industry:"Enterprise Software",  country:"Australia",  region:"Asia-Pacific",  date:"2026-03", headcount:1600,  aiConfidence:"genuine",     quote:"It would be disingenuous to pretend AI doesn't change the mix of skills we need or the number of roles required" },
  { company:"ANZ Bank",          industry:"Banking",              country:"Australia",  region:"Asia-Pacific",  date:"2025-09", headcount:3500,  aiConfidence:"washing",     quote:"This is not about profits — this is about what we need to do for a better company" },
  { company:"Telstra",           industry:"Telecommunications",   country:"Australia",  region:"Asia-Pacific",  date:"2024-05", headcount:2800,  aiConfidence:"washing",     quote:"AI is being used to improve half of Telstra's key processes" },
  { company:"Commonwealth Bank", industry:"Banking",              country:"Australia",  region:"Asia-Pacific",  date:"2026-02", headcount:300,   aiConfidence:"genuine",     quote:"Priority is to transition people into higher-impact roles requiring greater expertise, judgement and empathy" },
  { company:"Optus",             industry:"Telecommunications",   country:"Australia",  region:"Asia-Pacific",  date:"2025-05", headcount:440,   aiConfidence:"restructure",  quote:"Making further changes to become a world class digital service provider that puts customers first" },
  { company:"Spark NZ",          industry:"Telecommunications",   country:"New Zealand",region:"Asia-Pacific",  date:"2024-08", headcount:190,   aiConfidence:"genuine",     quote:"Jobs will go as it outsources to AI and a networking partner" },
  { company:"ams OSRAM",         industry:"Semiconductors",       country:"Austria",    region:"Europe",        date:"2026-01", headcount:2000,  aiConfidence:"restructure",  quote:"Structural reorganisation and automation of processes" },
  { company:"Ericsson",          industry:"Telecommunications",   country:"Sweden",     region:"Europe",        date:"2026-01", headcount:1900,  aiConfidence:"restructure",  quote:"Streamlining operations with AI-assisted workflows" },
  { company:"ASML",              industry:"Semiconductors",       country:"Netherlands",region:"Europe",        date:"2026-01", headcount:1700,  aiConfidence:"restructure",  quote:"Automation of back-office and operational functions" },
  { company:"Meta (Reality Labs)",industry:"Technology",          country:"USA",        region:"North America", date:"2026-02", headcount:1500,  aiConfidence:"genuine",     quote:"Simplify operations and redirect investment toward AI products" },
  { company:"Livspace",          industry:"Home Design Platform", country:"Singapore",  region:"Asia-Pacific",  date:"2026-01", headcount:1000,  aiConfidence:"genuine",     quote:"Accelerate AI adoption across digital interior-design marketplace" },
  { company:"Ocado",             industry:"E-commerce / Robotics",country:"UK",         region:"Europe",        date:"2026-03", headcount:1000,  aiConfidence:"genuine",     quote:"Completed a significant phase of investment in robotics and automation" },
  { company:"eBay",              industry:"E-commerce",           country:"USA",        region:"North America", date:"2026-01", headcount:800,   aiConfidence:"washing",     quote:"AI-driven forecasting reduced staffing needs in corporate functions" },
  { company:"Pinterest",         industry:"Social Media",         country:"USA",        region:"North America", date:"2026-01", headcount:675,   aiConfidence:"genuine",     quote:"Pivoting toward AI-forward strategy, prioritizing AI-focused teams" },
  { company:"Dow Chemical",      industry:"Manufacturing",        country:"USA",        region:"North America", date:"2025-12", headcount:4500,  aiConfidence:"genuine",     quote:"Eliminating roles as it steps up use of AI and automation" },
  { company:"Omnicom",           industry:"Media & Advertising",  country:"USA",        region:"North America", date:"2025-12", headcount:4000,  aiConfidence:"genuine",     quote:"Generative AI gives the company fresh agility and scale" },
  { company:"Chegg",             industry:"EdTech",               country:"USA",        region:"North America", date:"2025-10", headcount:3200,  aiConfidence:"genuine",     quote:"New realities of AI and reduced traffic from Google" },
  { company:"Salesforce",        industry:"Enterprise Software",  country:"USA",        region:"North America", date:"2025-09", headcount:4000,  aiConfidence:"genuine",     quote:"Efficiency gains from agentic AI product" },
  { company:"CrowdStrike",       industry:"Cybersecurity",        country:"USA",        region:"North America", date:"2025-06", headcount:500,   aiConfidence:"genuine",     quote:"AI reshaping every industry, accelerating threats, evolving customer needs" },
  { company:"Indeed / Glassdoor",industry:"Recruitment",          country:"USA",        region:"North America", date:"2025-05", headcount:1300,  aiConfidence:"genuine",     quote:"AI is changing the world and we must adapt accordingly" },
  { company:"MercadoLibre",      industry:"E-commerce",           country:"Argentina",  region:"Latin America", date:"2026-01", headcount:119,   aiConfidence:"genuine",     quote:"AI automatically generates product descriptions and categorizes listings" },
  { company:"ANGI Homeservices", industry:"Home Services",        country:"USA",        region:"North America", date:"2026-01", headcount:350,   aiConfidence:"washing",     quote:"Technology and operational efficiency improvements" },
  { company:"Oracle",            industry:"Enterprise Software",  country:"USA",        region:"North America", date:"2026-01", headcount:254,   aiConfidence:"washing",     quote:"Cost-saving measures and automated processes" },
];

// ─────────────────────────────────────────────────────────────
//  THEME SYSTEM
// ─────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:           "#08080f",
    surface:      "rgba(255,255,255,0.018)",
    surfaceHover: "rgba(255,255,255,0.045)",
    border:       "rgba(255,255,255,0.07)",
    borderMid:    "rgba(255,255,255,0.12)",
    text:         "#ffffff",
    textMid:      "rgba(255,255,255,0.5)",
    textDim:      "rgba(255,255,255,0.28)",
    textFaint:    "rgba(255,255,255,0.15)",
    btnBg:        "rgba(255,255,255,0.04)",
    btnBorder:    "rgba(255,255,255,0.09)",
    scrollThumb:  "rgba(255,255,255,0.1)",
    noiseOp:      0.025,
    tooltipBg:    "#0c0c14",
  },
  light: {
    bg:           "#f0ede8",
    surface:      "rgba(0,0,0,0.035)",
    surfaceHover: "rgba(0,0,0,0.07)",
    border:       "rgba(0,0,0,0.09)",
    borderMid:    "rgba(0,0,0,0.18)",
    text:         "#111111",
    textMid:      "rgba(0,0,0,0.52)",
    textDim:      "rgba(0,0,0,0.36)",
    textFaint:    "rgba(0,0,0,0.22)",
    btnBg:        "rgba(0,0,0,0.04)",
    btnBorder:    "rgba(0,0,0,0.1)",
    scrollThumb:  "rgba(0,0,0,0.15)",
    noiseOp:      0.014,
    tooltipBg:    "#ffffff",
  },
};

// ─────────────────────────────────────────────────────────────
//  CLASSIFICATION
// ─────────────────────────────────────────────────────────────
const CONF = {
  genuine:     { label:"Displaced by AI", short:"Displaced", color:"#ff3b3b", bg:"rgba(255,59,59,0.1)",  glow:"rgba(255,59,59,0.3)"  },
  washing:     { label:"AI Washing",      short:"Washing",   color:"#d4880a", bg:"rgba(212,136,10,0.1)", glow:"rgba(212,136,10,0.3)" },
  restructure: { label:"AI-Adjacent",     short:"Adjacent",  color:"#6b4fff", bg:"rgba(107,79,255,0.1)", glow:"rgba(107,79,255,0.3)" },
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const MONTH_NAMES = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt    = n  => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);
const fmtMon = dt => { if (!dt) return ""; const [y,m] = dt.split("-"); return `${MONTH_NAMES[+m]} ${y}`; };

function parseSheetRows(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => h.toLowerCase().trim());
  return rows.slice(1).map(row => {
    const o = {};
    headers.forEach((h,i) => { o[h] = row[i] || ""; });
    return {
      company:      o.company      || "",
      industry:     o.industry     || "Unknown",
      country:      o.country      || "",
      region:       o.region       || "Other",
      date:         o.date         || "",
      headcount:    parseInt(o.headcount || "0", 10),
      aiConfidence: o.aiconfidence || "restructure",
      quote:        o.quote        || "",
    };
  }).filter(r => r.company && r.headcount > 0);
}

// ─────────────────────────────────────────────────────────────
//  ICONS
// ─────────────────────────────────────────────────────────────
const LinkedInIcon = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const SunIcon = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.5"/>
    <line x1="12" y1="2" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22"/>
    <line x1="4.22" y1="4.22" x2="5.93" y2="5.93"/><line x1="18.07" y1="18.07" x2="19.78" y2="19.78"/>
    <line x1="2" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.93" y2="18.07"/><line x1="18.07" y1="5.93" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
//  SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────

function Pill({ conf, small }) {
  const c = CONF[conf] || CONF.restructure;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding: small ? "2px 8px" : "4px 12px", borderRadius:2,
      background:c.bg, border:`1px solid ${c.color}40`,
      fontFamily:"'IBM Plex Mono',monospace",
      fontSize: small ? 9 : 10, color:c.color,
      letterSpacing:1, whiteSpace:"nowrap", textTransform:"uppercase",
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.color,
        boxShadow:`0 0 5px ${c.color}`, display:"inline-block", flexShrink:0 }} />
      {small ? c.short : c.label}
    </span>
  );
}

function LiveBadge({ status, nextRun, t }) {
  const cfg = {
    live:    { dot:"#22c55e", label:"LIVE DATA",     pulse:true  },
    loading: { dot:"#6b4fff", label:"LOADING…",      pulse:true  },
    seed:    { dot:"#d4880a", label:"SEED DATA",     pulse:false },
    error:   { dot:"#ff3b3b", label:"SHEET OFFLINE", pulse:false },
  }[status] || { dot:"#d4880a", label:"SEED DATA", pulse:false };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8,
        border:`1px solid ${t.borderMid}`, borderRadius:4, padding:"5px 13px", background:t.btnBg }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot,
          boxShadow:`0 0 7px ${cfg.dot}`, animation:cfg.pulse?"blink 2s infinite":"none" }} />
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10,
          letterSpacing:3, color:t.textMid }}>{cfg.label}</span>
      </div>
      {nextRun && (
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
          color:t.textFaint, letterSpacing:1 }}>NEXT REFRESH {nextRun}</span>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent, t }) {
  return (
    <div style={{ borderTop:`2px solid ${accent}`, paddingTop:16 }}>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:3,
        color:t.textDim, textTransform:"uppercase", marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:48,
        lineHeight:1, color:t.text, letterSpacing:2 }}>{value}</div>
      {sub && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
        color:t.textFaint, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

function ThemeToggle({ dark, onToggle, t }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onToggle}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display:"flex", alignItems:"center", gap:7,
        padding:"7px 16px", borderRadius:4, cursor:"pointer",
        background: hovered ? t.surfaceHover : t.btnBg,
        border:`1px solid ${hovered ? t.borderMid : t.btnBorder}`,
        color:t.textMid, transition:"all 0.18s",
        fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:2,
      }}>
      {dark ? <SunIcon size={13} /> : <MoonIcon size={13} />}
      {dark ? "LIGHT MODE" : "DARK MODE"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//  CHART COMPONENTS
// ─────────────────────────────────────────────────────────────

function BubbleViz({ data, t }) {
  const [tip, setTip] = useState(null);

  const allDates = [...new Set(data.map(d => d.date))].filter(Boolean).sort();
  const months   = allDates.length ? allDates : ["2025-05","2025-09","2025-12","2026-01","2026-02","2026-03"];

  const W   = Math.max(700, months.length * 130);
  const H   = 300;
  const PAD = { top:16, right:24, bottom:36, left:56 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  // X: evenly spaced months
  const xOf = date => {
    const i = months.indexOf(date);
    if (months.length === 1) return PAD.left + plotW / 2;
    return PAD.left + (i / (months.length - 1)) * plotW;
  };

  // Y: log scale — larger headcount = higher up
  const headcounts = data.map(d => d.headcount).filter(h => h > 0);
  const logMin = Math.log(Math.max(Math.min(...headcounts, 100), 1));
  const logMax = Math.log(Math.max(...headcounts, 1000));
  const yOf = h => PAD.top + (1 - (Math.log(Math.max(h,1)) - logMin) / (logMax - logMin)) * plotH;

  // X jitter: spread overlapping dots within a month column
  const byMonth = {};
  data.forEach(d => { (byMonth[d.date] = byMonth[d.date] || []).push(d); });
  const jitterX = {};
  Object.entries(byMonth).forEach(([m, items]) => {
    const spread = Math.min(50, items.length * 10);
    items.forEach((d, i) => {
      jitterX[d.company] = items.length === 1
        ? 0
        : ((i / (items.length - 1)) - 0.5) * spread;
    });
  });

  // Y axis ticks
  const yTicks = [100, 500, 1000, 5000, 10000, 20000].filter(v =>
    Math.log(v) >= logMin - 0.5 && Math.log(v) <= logMax + 0.5
  );

  return (
    <div style={{ position:"relative" }}>
      <div style={{ overflowX:"auto" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", minWidth:500 }}>

          {/* Y gridlines + labels */}
          {yTicks.map(v => (
            <g key={v}>
              <line x1={PAD.left} y1={yOf(v)} x2={W-PAD.right} y2={yOf(v)}
                stroke={t.border} strokeWidth={1} strokeDasharray="2,5" />
              <text x={PAD.left-6} y={yOf(v)+4} textAnchor="end"
                fill={t.textDim} fontSize={8} fontFamily="IBM Plex Mono,monospace">{fmt(v)}</text>
            </g>
          ))}

          {/* X gridlines + month labels */}
          {months.map(m => (
            <g key={m}>
              <line x1={xOf(m)} y1={PAD.top} x2={xOf(m)} y2={H-PAD.bottom}
                stroke={t.border} strokeWidth={1} strokeDasharray="2,6" />
              <text x={xOf(m)} y={H-PAD.bottom+14} textAnchor="middle"
                fill={t.textDim} fontSize={9} fontFamily="IBM Plex Mono,monospace" letterSpacing={1}>
                {fmtMon(m).toUpperCase()}
              </text>
            </g>
          ))}

          {/* Bubbles — sorted smallest first so big ones don't swallow tiny ones */}
          {[...data].sort((a,b) => b.headcount - a.headcount).map((d, i) => {
            const cx = xOf(d.date) + (jitterX[d.company] || 0);
            const cy = yOf(d.headcount);
            const r  = Math.max(7, Math.sqrt(d.headcount / Math.max(...data.map(x=>x.headcount), 1)) * 44);
            const c  = CONF[d.aiConfidence] || CONF.restructure;
            return (
              <g key={i} style={{ cursor:"pointer" }}
                onMouseEnter={e => setTip({ d, x:e.clientX, y:e.clientY })}
                onMouseMove={e  => setTip(prev => prev ? { ...prev, x:e.clientX, y:e.clientY } : null)}
                onMouseLeave={() => setTip(null)}>
                <circle cx={cx} cy={cy} r={r+5} fill={c.color} opacity={0.07} />
                <circle cx={cx} cy={cy} r={r}   fill={c.color} opacity={0.85} />
                {r > 14 && (
                  <text x={cx} y={cy+4} textAnchor="middle" fill="#fff"
                    fontSize={Math.min(10, r * 0.52)} fontWeight={600}
                    fontFamily="IBM Plex Mono,monospace" style={{ pointerEvents:"none" }}>
                    {d.company.split(/[\s/(]/)[0]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {tip && (() => {
        const c = CONF[tip.d.aiConfidence] || CONF.restructure;
        return (
          <div style={{
            position:"fixed", left:tip.x+14, top:tip.y-90, zIndex:999, pointerEvents:"none",
            background:t.tooltipBg, border:`1px solid ${c.color}`,
            borderRadius:4, padding:"12px 16px", maxWidth:290,
            boxShadow:`0 8px 32px ${c.glow}`
          }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2, color:t.text }}>{tip.d.company}</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:c.color, letterSpacing:1, marginTop:3 }}>
              {fmt(tip.d.headcount)} JOBS · {tip.d.country}
            </div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:t.textDim, letterSpacing:1, marginTop:2 }}>
              {fmtMon(tip.d.date)} · {tip.d.industry}
            </div>
            {tip.d.quote && (
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                color:t.textMid, marginTop:8, lineHeight:1.6, fontStyle:"italic" }}>
                "{tip.d.quote}"
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function BarChart({ data, t }) {
  const byInd = {};
  data.forEach(d => { byInd[d.industry] = (byInd[d.industry]||0) + d.headcount; });
  const rows = Object.entries(byInd).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const max  = rows[0]?.[1] || 1;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {rows.map(([ind, total], i) => (
        <div key={i}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:t.textMid, letterSpacing:1 }}>
              {ind.toUpperCase()}
            </span>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:t.text, letterSpacing:2 }}>
              {fmt(total)}
            </span>
          </div>
          <div style={{ height:3, background:t.border, borderRadius:1 }}>
            <div style={{
              height:"100%", borderRadius:1, background:"linear-gradient(90deg,#ff3b3b,#ff7b3b)",
              width:`${(total/max)*100}%`, transition:"width 1.2s cubic-bezier(0.16,1,0.3,1)"
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  VIEW COMPONENTS
// ─────────────────────────────────────────────────────────────

function TimelineView({ data, t }) {
  const months = [...new Set(data.map(d=>d.date))].filter(Boolean).sort().reverse();
  return (
    <div>
      {months.map(month => {
        const rows = data.filter(d=>d.date===month);
        if (!rows.length) return null;
        return (
          <div key={month} style={{ display:"flex", gap:24, marginBottom:32 }}>
            <div style={{ width:72, flexShrink:0, paddingTop:3 }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                letterSpacing:3, color:"#ff3b3b", textTransform:"uppercase" }}>{fmtMon(month)}</span>
            </div>
            <div style={{ flex:1, borderLeft:"1px solid rgba(255,59,59,0.22)", paddingLeft:24, position:"relative" }}>
              <div style={{ position:"absolute", left:-4, top:5, width:7, height:7,
                borderRadius:"50%", background:"#ff3b3b", boxShadow:"0 0 8px rgba(255,59,59,0.5)" }}/>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {rows.map((d,i) => (
                  <div key={i} style={{ padding:"14px 18px", borderRadius:4,
                    background:t.surface, border:`1px solid ${t.border}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                      <div>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif",
                          fontSize:22, letterSpacing:2, color:t.text }}>{d.company}</div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                          letterSpacing:2, color:t.textDim, marginTop:2 }}>
                          {d.industry.toUpperCase()} · {d.country.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28,
                          color:"#ff3b3b", letterSpacing:2, lineHeight:1 }}>{fmt(d.headcount)}</div>
                        <Pill conf={d.aiConfidence} small />
                      </div>
                    </div>
                    {d.quote && (
                      <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${t.border}`,
                        fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                        color:t.textDim, lineHeight:1.7, fontStyle:"italic" }}>
                        "{d.quote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ data, t }) {
  const [sortBy,  setSortBy]  = useState("headcount");
  const [sortDir, setSortDir] = useState("desc");

  const cols = [
    { key:"company",      label:"Company" },
    { key:"industry",     label:"Industry" },
    { key:"country",      label:"Country" },
    { key:"headcount",    label:"Jobs" },
    { key:"date",         label:"Date" },
    { key:"aiConfidence", label:"Classification" },
  ];

  const handleSort = key => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const sorted = [...data].sort((a, b) => {
    let av = a[sortBy], bv = b[sortBy];
    if (sortBy === "headcount") { av = a.headcount; bv = b.headcount; }
    if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ borderBottom:`1px solid ${t.borderMid}` }}>
            {cols.map(({ key, label }) => {
              const active = sortBy === key;
              return (
                <th key={key} onClick={() => handleSort(key)}
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:3,
                    color: active ? t.text : t.textDim, textTransform:"uppercase",
                    padding:"10px 16px", textAlign:"left", fontWeight:400,
                    cursor:"pointer", userSelect:"none", whiteSpace:"nowrap",
                    transition:"color 0.12s" }}>
                  {label}
                  <span style={{ marginLeft:5, opacity: active ? 1 : 0.3, fontSize:8 }}>
                    {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, i) => (
            <tr key={i}
              style={{ borderBottom:`1px solid ${t.border}`,
                background:i%2===0?t.surface:"transparent", transition:"background 0.12s", cursor:"default" }}
              onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
              onMouseLeave={e=>e.currentTarget.style.background=i%2===0?t.surface:"transparent"}>
              <td style={{ padding:"12px 16px" }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:600,
                  fontSize:12, color:t.text }}>{d.company}</div>
              </td>
              <td style={{ padding:"12px 16px", fontFamily:"'IBM Plex Mono',monospace",
                fontSize:10, color:t.textMid }}>{d.industry}</td>
              <td style={{ padding:"12px 16px", fontFamily:"'IBM Plex Mono',monospace",
                fontSize:10, color:t.textMid }}>{d.country}</td>
              <td style={{ padding:"12px 16px", fontFamily:"'Bebas Neue',sans-serif",
                fontSize:20, color:"#ff3b3b", letterSpacing:2 }}>{fmt(d.headcount)}</td>
              <td style={{ padding:"12px 16px", fontFamily:"'IBM Plex Mono',monospace",
                fontSize:10, color:t.textDim, whiteSpace:"nowrap" }}>{fmtMon(d.date)}</td>
              <td style={{ padding:"12px 16px" }}><Pill conf={d.aiConfidence} small /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────
export default function MadeRedundant() {
  const isMobile = useIsMobile();
  const [isDark,         setIsDark]        = useState(true);
  const [data,           setData]          = useState(SEED_DATA);
  const [status,         setStatus]        = useState("seed");
  const [lastFetched,    setLastFetched]   = useState(null);
  const [tab,            setTab]           = useState("overview");
  const [regionFilter,   setRegionFilter]  = useState("All");
  const [confFilter,     setConfFilter]    = useState("All");
  const [search,         setSearch]        = useState("");
  const [mounted,        setMounted]       = useState(false);

  const t = THEMES[isDark ? "dark" : "light"];

  useEffect(() => { setTimeout(()=>setMounted(true), 60); }, []);

  // Persist theme
  useEffect(() => { try { localStorage.setItem("mr-theme", isDark?"dark":"light"); } catch {} }, [isDark]);
  useEffect(() => { try { const s=localStorage.getItem("mr-theme"); if(s) setIsDark(s==="dark"); } catch {} }, []);

  const fetchSheet = useCallback(async () => {
    if (!SHEET_ID || !API_KEY) return;
    setStatus("loading");
    try {
      const res  = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`);
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      const rows = parseSheetRows(json.values||[]);
      if (rows.length) {
        // Merge: sheet entries take precedence; seed fills any company not yet in sheet
        const sheetNames = new Set(rows.map(r => r.company.toLowerCase().trim()));
        const merged = [...rows, ...SEED_DATA.filter(s => !sheetNames.has(s.company.toLowerCase().trim()))];
        setData(merged); setStatus("live"); setLastFetched(new Date().toISOString());
      } else setStatus("error");
    } catch { setStatus("error"); }
  }, []);

  useEffect(() => {
    fetchSheet();
    const id = setInterval(fetchSheet, 10*60*1000);
    return () => clearInterval(id);
  }, [fetchSheet]);

  const oneYearAgo = (() => { const d = new Date(); d.setFullYear(d.getFullYear()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })();

  const regions  = ["All", ...Array.from(new Set(data.map(d=>d.region))).sort()];
  const searchQ  = search.trim().toLowerCase();
  const filtered = data
    .filter(d =>
      d.date >= oneYearAgo &&
      (regionFilter==="All" || d.region===regionFilter) &&
      (confFilter==="All"   || d.aiConfidence===confFilter) &&
      (!searchQ || d.company.toLowerCase().includes(searchQ) || d.industry.toLowerCase().includes(searchQ))
    )
    .sort((a,b)=>b.headcount-a.headcount);

  const totalJobs    = filtered.reduce((s,d)=>s+d.headcount, 0);
  const genuineJobs  = filtered.filter(d=>d.aiConfidence==="genuine").reduce((s,d)=>s+d.headcount, 0);
  const washingCount = filtered.filter(d=>d.aiConfidence==="washing").length;
  const companies    = filtered.length;

  // Australia / NZ spotlight — same 1-year window + classification filter as the rest of the dashboard
  const auData      = data.filter(d =>
    (d.country==="Australia" || d.country==="New Zealand") &&
    d.date >= oneYearAgo &&
    (confFilter==="All" || d.aiConfidence===confFilter)
  );
  const auJobs      = auData.reduce((s,d)=>s+d.headcount, 0);
  const auGenuine   = auData.filter(d=>d.aiConfidence==="genuine").reduce((s,d)=>s+d.headcount, 0);
  const auCompanies = auData.length;

  const nextRun = lastFetched
    ? new Date(new Date(lastFetched).getTime()+7*24*3600*1000)
        .toLocaleDateString("en-AU",{weekday:"short",hour:"2-digit",minute:"2-digit"}).toUpperCase()
    : null;

  return (
    <div style={{
      minHeight:"100vh", background:t.bg, color:t.text,
      fontFamily:"'IBM Plex Mono',monospace",
      opacity:mounted?1:0,
      transition:"opacity 0.4s ease, background 0.35s ease, color 0.35s ease",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet"/>

      {/* Noise overlay */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, opacity:t.noiseOp,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize:"256px 256px" }}/>

      {/* Red accent bar */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:2, zIndex:100,
        background:"linear-gradient(90deg,#ff3b3b 0%,#ff7b3b 55%,transparent 100%)" }}/>

      <div style={{ position:"relative", zIndex:1, maxWidth:1240, margin:"0 auto", padding: isMobile ? "32px 16px" : "48px 24px" }}>

        {/* ══ MASTHEAD ══ */}
        <div style={{ marginBottom:48 }}>

          {/* Title row + theme toggle */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
            flexWrap:"wrap", gap:16, marginBottom:4 }}>
            <h1 style={{ fontFamily:"'Bebas Neue',sans-serif",
              fontSize:"clamp(46px,9vw,96px)", letterSpacing:6, margin:0, lineHeight:1, color:t.text }}>
              MADE REDUNDANT
            </h1>
            <div style={{ paddingTop:6 }}>
              <ThemeToggle dark={isDark} onToggle={()=>setIsDark(d=>!d)} t={t}/>
            </div>
          </div>

          {/* Byline — Abi Chaudhuri + LinkedIn icon */}
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:18,
              fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:3,
              color:t.textDim, textDecoration:"none", transition:"color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.color="#0a66c2"}
            onMouseLeave={e=>e.currentTarget.style.color=t.textDim}>
            BY ABI CHAUDHURI
            <LinkedInIcon size={13}/>
          </a>

          {/* Subtitle row */}
          <div style={{ display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, letterSpacing:0.5,
              color:t.textMid, margin:0, lineHeight:1.8, maxWidth:500 }}>
              Tracking every workforce reduction attributed to artificial intelligence.<br/>
              <span style={{ color:t.textFaint }}>
                Updated weekly · Classified by Claude AI · Automated with n8n
              </span>
            </p>
            <LiveBadge status={status} nextRun={nextRun} t={t}/>
          </div>
        </div>

        {/* ══ STATS ══ */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",
          gap:"0 48px", marginBottom:52,
          borderTop:`1px solid ${t.border}`, paddingTop:32 }}>
          <Stat label="Total Jobs Lost"     value={fmt(totalJobs)}   sub="across all tracked companies"  accent="#ff3b3b"          t={t}/>
          <Stat label="Displaced by AI"     value={fmt(genuineJobs)} sub="roles directly automated away" accent="#ff7b3b"          t={t}/>
          <Stat label="AI Washing Suspects" value={washingCount}     sub="financially motivated cuts"    accent={CONF.washing.color} t={t}/>
          <Stat label="Companies Tracked"   value={companies}        sub="and counting"                  accent={CONF.restructure.color} t={t}/>
        </div>

        {/* ══ AUSTRALIA SPOTLIGHT ══ */}
        {auCompanies > 0 && (
          <div style={{
            marginBottom:28, padding:"16px 20px", borderRadius:4,
            background:"rgba(0,160,100,0.06)", border:"1px solid rgba(0,180,110,0.18)",
            display:"flex", alignItems:"center", gap:24, flexWrap:"wrap",
          }}>
            <span style={{ fontSize:18 }}>🇦🇺</span>
            <div style={{ flex:1, minWidth:160 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:3,
                color:"rgba(0,200,120,0.7)", textTransform:"uppercase", marginBottom:4 }}>
                Australia &amp; NZ Spotlight · Last 12 months
              </div>
              <div style={{ display:"flex", gap:32, flexWrap:"wrap" }}>
                <div>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28,
                    color:"#00c878", letterSpacing:2 }}>{fmt(auJobs)}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                    color:"rgba(0,200,120,0.55)", marginLeft:8, letterSpacing:1 }}>TOTAL JOBS</span>
                </div>
                <div>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28,
                    color:"#00c878", letterSpacing:2 }}>{fmt(auGenuine)}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                    color:"rgba(0,200,120,0.55)", marginLeft:8, letterSpacing:1 }}>DISPLACED BY AI</span>
                </div>
                <div>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28,
                    color:"#00c878", letterSpacing:2 }}>{auCompanies}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                    color:"rgba(0,200,120,0.55)", marginLeft:8, letterSpacing:1 }}>COMPANIES</span>
                </div>
              </div>
            </div>
            <button onClick={() => setRegionFilter("Asia-Pacific")}
              style={{ padding:"6px 16px", borderRadius:2, cursor:"pointer",
                background:"rgba(0,180,110,0.1)", border:"1px solid rgba(0,180,110,0.3)",
                color:"#00c878", fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                letterSpacing:2, whiteSpace:"nowrap", flexShrink:0 }}>
              FILTER REGION ↗
            </button>
          </div>
        )}

        {/* ══ FILTERS ══ */}
        <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"center",
          marginBottom:28, paddingBottom:24, borderBottom:`1px solid ${t.border}` }}>

          {/* Search */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
              fontSize:11, color:t.textDim, pointerEvents:"none" }}>⌕</span>
            <input
              type="text"
              placeholder="Search company or industry…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                paddingLeft:26, paddingRight:search ? 28 : 12, paddingTop:5, paddingBottom:5,
                background:t.btnBg, border:`1px solid ${search ? t.borderMid : t.btnBorder}`,
                borderRadius:2, color:t.text, outline:"none",
                fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:1,
                width:220, transition:"border-color 0.15s",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer",
                  color:t.textDim, fontSize:12, lineHeight:1, padding:0 }}>✕</button>
            )}
          </div>

          {/* Classification toggle buttons */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[["All","ALL",null], ...Object.entries(CONF).map(([k,v])=>[k,v.short,v.color])].map(([key,label,color])=>{
              const active = confFilter===key;
              return (
                <button key={key} onClick={()=>setConfFilter(active&&key!=="All"?"All":key)}
                  style={{
                    padding:"5px 14px", borderRadius:2, cursor:"pointer", transition:"all 0.15s",
                    background: active ? (color?`${color}22`:t.surfaceHover) : t.btnBg,
                    border:`1px solid ${active?(color||t.borderMid):t.btnBorder}`,
                    color: active ? (color||t.text) : t.textMid,
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:2,
                  }}>
                  {label.toUpperCase()}
                  <span style={{ marginLeft:6, opacity:0.45, fontSize:9 }}>
                    ({key==="All"?data.length:data.filter(d=>d.aiConfidence===key).length})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Region filter */}
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:9, letterSpacing:3, color:t.textFaint }}>REGION:</span>
            {regions.map(r => (
              <button key={r} onClick={()=>setRegionFilter(r)}
                style={{
                  padding:"4px 10px", borderRadius:2, cursor:"pointer", transition:"all 0.15s",
                  background: regionFilter===r?"rgba(255,59,59,0.1)":t.btnBg,
                  border:`1px solid ${regionFilter===r?"#ff3b3b40":t.btnBorder}`,
                  color: regionFilter===r?"#ff3b3b":t.textDim,
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:1,
                }}>{r.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* ══ TABS ══ */}
        <div style={{ display:"flex", marginBottom:28, borderBottom:`1px solid ${t.border}` }}>
          {["overview","timeline","table"].map(tb => (
            <button key={tb} onClick={()=>setTab(tb)}
              style={{
                padding:"10px 24px", background:"none", border:"none",
                borderBottom:`2px solid ${tab===tb?"#ff3b3b":"transparent"}`,
                color:tab===tb?t.text:t.textDim,
                fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:3,
                cursor:"pointer", textTransform:"uppercase", marginBottom:-1, transition:"all 0.15s",
              }}>{tb}</button>
          ))}
          <div style={{ marginLeft:"auto", alignSelf:"center",
            fontSize:9, letterSpacing:2, color:t.textFaint }}>
            {filtered.length} RECORDS · {fmt(totalJobs)} JOBS
          </div>
        </div>

        {/* ══ OVERVIEW ══ */}
        {tab==="overview" && (
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap:20 }}>
            <div style={{ border:`1px solid ${t.border}`, borderRadius:4,
              padding:24, background:t.surface }}>
              <div style={{ fontSize:9, letterSpacing:3, color:t.textDim,
                marginBottom:20, textTransform:"uppercase" }}>Timeline · Bubble Size = Headcount</div>
              <BubbleViz data={filtered} t={t}/>
            </div>
            <div style={{ border:`1px solid ${t.border}`, borderRadius:4,
              padding:24, background:t.surface }}>
              <div style={{ fontSize:9, letterSpacing:3, color:t.textDim,
                marginBottom:20, textTransform:"uppercase" }}>Impact by Industry</div>
              <BarChart data={filtered} t={t}/>
            </div>
          </div>
        )}

        {/* ══ TIMELINE ══ */}
        {tab==="timeline" && (
          <div style={{ border:`1px solid ${t.border}`, borderRadius:4,
            padding: isMobile ? "16px" : "28px 32px", background:t.surface }}>
            <TimelineView data={filtered} t={t}/>
          </div>
        )}

        {/* ══ TABLE ══ */}
        {tab==="table" && (
          <div style={{ border:`1px solid ${t.border}`, borderRadius:4,
            background:t.surface, overflow:"hidden" }}>
            <TableView data={filtered} t={t}/>
            <div style={{ padding:"12px 16px", fontSize:9, letterSpacing:2,
              color:t.textFaint, borderTop:`1px solid ${t.border}` }}>
              {filtered.length} COMPANIES · {fmt(totalJobs)} TOTAL POSITIONS
            </div>
          </div>
        )}

        {/* ══ FOOTER ══ */}
        <div style={{ marginTop:48, paddingTop:20, borderTop:`1px solid ${t.border}`,
          display:"flex", justifyContent:"space-between", alignItems:"center",
          flexWrap:"wrap", gap:12 }}>
          <span style={{ fontSize:9, letterSpacing:2, color:t.textFaint }}>
            SOURCES: LAYOFFS.FYI · PROGRAMS.COM · RATIONALFX · CHALLENGER GRAY &amp; CHRISTMAS
          </span>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:7,
              fontSize:9, letterSpacing:2, color:t.textFaint, textDecoration:"none",
              transition:"color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.color="#0a66c2"}
            onMouseLeave={e=>e.currentTarget.style.color=t.textFaint}>
            MADEREDUNDANT.IO · BY ABI CHAUDHURI
            <LinkedInIcon size={11}/>
          </a>
        </div>

      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.18} }
        * { box-sizing:border-box; margin:0; padding:0; }
        button { outline:none; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${t.scrollThumb}; border-radius:2px; }
      `}</style>
    </div>
  );
}
