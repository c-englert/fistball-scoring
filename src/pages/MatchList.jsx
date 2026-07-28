import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMatches, draftStates } from "../store.js";

export default function MatchList() {
  const [matches, setMatches] = useState([]);
  const [states, setStates] = useState({});

  useEffect(() => {
    (async () => {
      setMatches(await getMatches());
      setStates(await draftStates());
    })();
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="title">Fistball Scoring</div>
          <div className="sub">Game reports · U18 WC &amp; Women's EFA 2026</div>
        </div>
      </header>

      <div className="content">
        {matches.length === 0 && <div className="empty">No games assigned.</div>}
        {matches.map((m) => {
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
