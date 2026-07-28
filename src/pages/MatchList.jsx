import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMatches, draftStates } from "../store.js";

function parseDate(s) {
  const [d, m, y] = String(s).split("/").map(Number);
  return new Date(2000 + (y || 0), (m || 1) - 1, d || 1);
}
function dayLabel(s) {
  const dt = parseDate(s);
  const wd = dt.toLocaleDateString("en-US", { weekday: "short" });
  const mo = dt.toLocaleDateString("en-US", { month: "short" });
  return `${wd} ${dt.getDate()} ${mo}`;
}

export default function MatchList() {
  const [matches, setMatches] = useState([]);
  const [states, setStates] = useState({});
  const [court, setCourt] = useState(() => localStorage.getItem("fb_court") || "all");
  const [day, setDay] = useState(() => localStorage.getItem("fb_day") || "all");

  useEffect(() => {
    (async () => {
      setMatches(await getMatches());
      setStates(await draftStates());
    })();
  }, []);

  const courts = useMemo(
    () => [...new Set(matches.map((m) => m.court))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })),
    [matches]
  );
  const days = useMemo(
    () => [...new Set(matches.map((m) => m.date))].sort((a, b) => parseDate(a) - parseDate(b)),
    [matches]
  );

  const shown = matches.filter(
    (m) => (court === "all" || String(m.court) === String(court)) && (day === "all" || m.date === day)
  );

  const pickCourt = (c) => { setCourt(c); localStorage.setItem("fb_court", c); };
  const pickDay = (d) => { setDay(d); localStorage.setItem("fb_day", d); };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-logo"><img src={import.meta.env.BASE_URL + "ifa-mark.png"} alt="IFA" /></div>
        <div>
          <div className="title">Fistball Scoring</div>
          <div className="sub">Game reports · U18 WC &amp; Women's EFA 2026</div>
        </div>
      </header>

      <div className="filter-bar">
        <span className="filter-label">Day</span>
        <button className={`filter-pill ${day === "all" ? "active" : ""}`} onClick={() => pickDay("all")}>All</button>
        {days.map((d) => (
          <button key={d} className={`filter-pill ${day === d ? "active" : ""}`} onClick={() => pickDay(d)}>{dayLabel(d)}</button>
        ))}
      </div>
      <div className="filter-bar">
        <span className="filter-label">Court</span>
        <button className={`filter-pill ${court === "all" ? "active" : ""}`} onClick={() => pickCourt("all")}>All</button>
        {courts.map((c) => (
          <button key={c} className={`filter-pill ${String(court) === String(c) ? "active" : ""}`} onClick={() => pickCourt(c)}>Court {c}</button>
        ))}
      </div>

      <div className="content">
        {shown.length === 0 && <div className="empty">No games for this filter.</div>}
        {shown.map((m) => {
          const st = states[m.id]?.status || "none";
          const label = st === "submitted" ? "Submitted" : st === "draft" ? "Draft" : "Not started";
          return (
            <Link className="match-card" key={m.id} to={`/game/${m.id}`}>
              <div className="mc-top">
                <span className="tag">#{m.nr}</span>
                <span className="tag day">{dayLabel(m.date)}</span>
                <span>{m.time}</span>
                <span className="tag">Court {m.court}</span>
                <span>{m.round}</span>
                <span className="tag">{m.category}</span>
                <span className={`state ${st}`}>{label}</span>
              </div>
              <div className="mc-teams">
                {m.teamA.name.split(" - ")[0]}
                <span className="vs">vs</span>
                {m.teamB.name.split(" - ")[0]}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
