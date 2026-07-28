import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMatches, draftStates } from "../store.js";

export default function MatchList() {
  const [matches, setMatches] = useState([]);
  const [states, setStates] = useState({});
  const [court, setCourt] = useState(() => localStorage.getItem("fb_court") || "all");

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
  const shown = court === "all" ? matches : matches.filter((m) => String(m.court) === String(court));

  const pick = (c) => { setCourt(c); localStorage.setItem("fb_court", c); };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="title">Fistball Scoring</div>
          <div className="sub">Game reports · U18 WC &amp; Women's EFA 2026</div>
        </div>
      </header>

      <div className="court-bar">
        <span className="court-label">Court</span>
        <button className={`court-pill ${court === "all" ? "active" : ""}`} onClick={() => pick("all")}>All</button>
        {courts.map((c) => (
          <button key={c} className={`court-pill ${String(court) === String(c) ? "active" : ""}`} onClick={() => pick(c)}>
            Court {c}
          </button>
        ))}
      </div>

      <div className="content">
        {shown.length === 0 && <div className="empty">No games for this court.</div>}
        {shown.map((m) => {
          const st = states[m.id]?.status || "none";
          const label = st === "submitted" ? "Submitted" : st === "draft" ? "Draft" : "Not started";
          return (
            <Link className="match-card" key={m.id} to={`/game/${m.id}`}>
              <div className="mc-top">
                <span className="tag">#{m.nr}</span>
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
