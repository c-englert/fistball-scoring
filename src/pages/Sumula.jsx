import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrInitDraft, saveDraft, submitDraft } from "../store.js";

const SECTIONS = [
  ["info", "Info"],
  ["lineup", "Line-ups"],
  ["score", "Score"],
  ["refs", "Referees"],
  ["finish", "Finish"],
];

export default function Sumula() {
  const { id } = useParams();
  const nav = useNavigate();
  const [draft, setDraft] = useState(null);
  const [section, setSection] = useState("info");
  const [team, setTeam] = useState("teamA");
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    (async () => setDraft(await getOrInitDraft(id)))();
  }, [id]);

  function update(mutator) {
    setDraft((cur) => {
      const next = structuredClone(cur);
      mutator(next);
      setSaved(false);
      saveDraft(id, next).then(() => setSaved(true));
      return next;
    });
  }

  const scoring = useMemo(() => computeScore(draft), [draft]);

  if (!draft) return <div className="empty">Loading…</div>;

  const submitted = !!draft.submittedAt;

  return (
    <div className="app">
      <header className="topbar">
        <button className="iconbtn" onClick={() => nav("/")}>‹ Games</button>
        <div className="spacer" />
        <div style={{ textAlign: "right" }}>
          <div className="title">#{draft.info.nr} · {short(draft.teamA.name)} vs {short(draft.teamB.name)}</div>
          <div className="sub">{draft.info.time} · Court {draft.info.court} · Best of {draft.info.bestOf}</div>
        </div>
      </header>

      <nav className="steps">
        {SECTIONS.map(([k, label]) => (
          <button key={k} className={`step ${section === k ? "active" : ""}`} onClick={() => setSection(k)}>
            {label}
          </button>
        ))}
      </nav>

      <div className="content">
        {section === "info" && <InfoSection d={draft} />}
        {section === "lineup" && (
          <LineupSection d={draft} team={team} setTeam={setTeam} update={update} />
        )}
        {section === "score" && <ScoreSection d={draft} scoring={scoring} update={update} />}
        {section === "refs" && <RefsSection d={draft} update={update} />}
        {section === "finish" && <FinishSection d={draft} scoring={scoring} update={update} />}
      </div>

      <div className="bottombar">
        <span className="status">
          {submitted ? "✓ Submitted (stored on device)" : saved ? "✓ Draft saved on device" : "Saving…"}
        </span>
        {section !== "finish" ? (
          <button className="btn primary" onClick={() => setSection(nextSection(section))}>Next ›</button>
        ) : (
          <button
            className="btn primary"
            disabled={submitted}
            onClick={async () => { await submitDraft(id); setDraft(await getOrInitDraft(id)); }}
          >
            {submitted ? "Submitted" : "Submit report"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- sections ---------------- */

function InfoSection({ d }) {
  const rows = [
    ["Match Nr", "#" + d.info.nr],
    ["Date", d.info.date],
    ["Time", d.info.time],
    ["Court", d.info.court],
    ["Round", d.info.round],
    ["Category", d.info.category],
    ["Best of", d.info.bestOf],
    ["Team A", d.teamA.name],
    ["Team B", d.teamB.name],
  ];
  return (
    <div className="card">
      <h2>Match information</h2>
      <div className="grid2">
        {rows.map(([k, v]) => (
          <div className="field" key={k}>
            <label>{k}</label>
            <div className="readonly">{v}</div>
          </div>
        ))}
      </div>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>
        Round &amp; category come from the schedule; the rest is filled in the next tabs.
      </p>
    </div>
  );
}

function LineupSection({ d, team, setTeam, update }) {
  const t = d[team];
  const toggleCaptain = (i) =>
    update((n) => n[team].players.forEach((p, j) => (p.captain = j === i ? !p.captain : false)));
  const toggleOC = (i) => update((n) => (n[team].players[i].onCourt = !n[team].players[i].onCourt));
  const toggleCard = (list, i, kind) =>
    update((n) => (n[team][list][i].cards[kind] = !n[team][list][i].cards[kind]));

  return (
    <>
      <div className="team-tabs">
        <button className={`team-tab ${team === "teamA" ? "active" : ""}`} onClick={() => setTeam("teamA")}>
          {short(d.teamA.name)}
        </button>
        <button className={`team-tab ${team === "teamB" ? "active" : ""}`} onClick={() => setTeam("teamB")}>
          {short(d.teamB.name)}
        </button>
      </div>

      <div className="card">
        <h2>Players — tap C (captain), OC (on court), or a card</h2>
        {t.players.map((p, i) => (
          <div className="player" key={i}>
            <div className="pnr">{p.nr}</div>
            <div className="pname">
              <div className="sur">{p.name}</div>
              <div className="giv">{p.first}</div>
            </div>
            <button className={`chip cap ${p.captain ? "on" : ""}`} onClick={() => toggleCaptain(i)}>C</button>
            <button className={`chip oc ${p.onCourt ? "on" : ""}`} onClick={() => toggleOC(i)}>OC</button>
            <div className="card-chips">
              {["y", "yr", "r"].map((k) => (
                <button key={k} className={`chip ${k} ${p.cards[k] ? "on" : ""}`} onClick={() => toggleCard("players", i, k)}>
                  {k.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}

        {t.staff.length > 0 && <div className="subhead">Staff</div>}
        {t.staff.map((s, i) => (
          <div className="player" key={i}>
            <div className="prole">{s.role}</div>
            <div className="pname">
              <div className="sur">{s.name}</div>
              <div className="giv">{s.first}</div>
            </div>
            <div className="card-chips">
              {["y", "yr", "r"].map((k) => (
                <button key={k} className={`chip ${k} ${s.cards[k] ? "on" : ""}`} onClick={() => toggleCard("staff", i, k)}>
                  {k.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ScoreSection({ d, scoring, update }) {
  const [cur, setCur] = useState(() => {
    const i = d.sets.findIndex((s) => !(s.rallies && s.rallies.length));
    return i === -1 ? d.sets.length - 1 : i;
  });
  const scroller = useRef(null);
  const [selCol, setSelCol] = useState(null);   // rally being corrected
  const set = d.sets[cur] || { rallies: [] };
  const rallies = set.rallies || [];
  const { a, b } = setScore(set);

  useEffect(() => {
    const el = scroller.current;
    if (el && selCol == null) el.scrollLeft = el.scrollWidth;
  }, [rallies.length, cur, selCol]);
  useEffect(() => setSelCol(null), [cur]);

  const addPoint = (w) => update((n) => {
    if (!n.sets[cur].rallies) n.sets[cur].rallies = [];
    n.sets[cur].rallies.push(w);
  });
  const undo = () => update((n) => { if (n.sets[cur].rallies) n.sets[cur].rallies.pop(); });
  const setRally = (i, w) => { update((n) => { n.sets[cur].rallies[i] = w; }); setSelCol(null); };
  const removeRally = (i) => { update((n) => { n.sets[cur].rallies.splice(i, 1); }); setSelCol(null); };
  const setBall = (which, val) => update((n) => (n.ballChoice[which] = val));

  // Build the two paper rows: the scorer's running number, "/" on the other side.
  const rowA = [], rowB = [];
  let ca = 0, cb = 0;
  for (const w of rallies) {
    if (w === "A") { ca++; rowA.push(String(ca)); rowB.push("/"); }
    else { cb++; rowB.push(String(cb)); rowA.push("/"); }
  }

  return (
    <div className="card">
      <div className="set-pills">
        {d.sets.map((s, i) => {
          const sc = setScore(s);
          return (
            <button key={i} className={`step ${i === cur ? "active" : ""}`} onClick={() => setCur(i)}>
              Set {i + 1}{sc.a + sc.b ? ` · ${sc.a}:${sc.b}` : ""}
            </button>
          );
        })}
      </div>

      <div className="score-big">
        <span className={a > b ? "lead" : ""}>{a}</span>
        <span className="colon">:</span>
        <span className={b > a ? "lead" : ""}>{b}</span>
      </div>

      <div className="rally" ref={scroller}>
        <div className="rally-row">
          <div className="rally-team">{short(d.teamA.name)}</div>
          <div className="rally-cells">
            {rowA.length === 0 && <span className="cell x">·</span>}
            {rowA.map((c, i) => (
              <button key={i} className={`cell ${c === "/" ? "x" : ""} ${selCol === i ? "sel" : ""}`} onClick={() => setSelCol(selCol === i ? null : i)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="rally-row">
          <div className="rally-team">{short(d.teamB.name)}</div>
          <div className="rally-cells">
            {rowB.length === 0 && <span className="cell x">·</span>}
            {rowB.map((c, i) => (
              <button key={i} className={`cell ${c === "/" ? "x" : ""} ${selCol === i ? "sel" : ""}`} onClick={() => setSelCol(selCol === i ? null : i)}>{c}</button>
            ))}
          </div>
        </div>
      </div>
      {rallies.length > 0 && selCol == null && (
        <p className="hint">Tapped the wrong side? Tap that point in the record to fix it.</p>
      )}

      {selCol != null && (
        <div className="correct-bar">
          <span className="cb-label">Rally {selCol + 1} — who scored?</span>
          <div className="cb-actions">
            <button className="btn" onClick={() => setRally(selCol, "A")}>{short(d.teamA.name)}</button>
            <button className="btn" onClick={() => setRally(selCol, "B")}>{short(d.teamB.name)}</button>
            <button className="btn danger" onClick={() => removeRally(selCol)}>✕ Remove</button>
            <button className="btn ghost" onClick={() => setSelCol(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="point-buttons">
        <button className="pt a" onClick={() => addPoint("A")}>
          <span className="pt-team">{short(d.teamA.name)}</span>
          <span className="pt-plus">+ point</span>
        </button>
        <button className="pt b" onClick={() => addPoint("B")}>
          <span className="pt-team">{short(d.teamB.name)}</span>
          <span className="pt-plus">+ point</span>
        </button>
      </div>
      <button className="btn undo" onClick={undo} disabled={!rallies.length}>↶ Undo last point</button>

      <div className="tally">
        <div className={`t ${scoring.setsA > scoring.setsB ? "lead" : ""}`}><div className="n">{scoring.setsA}</div><div>sets</div></div>
        <div className={`t ${scoring.setsB > scoring.setsA ? "lead" : ""}`}><div className="n">{scoring.setsB}</div><div>sets</div></div>
      </div>
      {scoring.winner && (
        <p style={{ textAlign: "center", fontWeight: 800, color: "var(--win)" }}>
          Winner: {short(scoring.winner === "A" ? d.teamA.name : d.teamB.name)}
        </p>
      )}

      <div className="subhead">Choice of ball / serve</div>
      {["set1", "set5"].map((w) => (
        <div className="field" key={w}>
          <label>{w === "set1" ? "1st set" : "5th set"}</label>
          <div className="seg">
            <button className={d.ballChoice[w] === "A" ? "on" : ""} onClick={() => setBall(w, "A")}>{short(d.teamA.name)}</button>
            <button className={d.ballChoice[w] === "B" ? "on" : ""} onClick={() => setBall(w, "B")}>{short(d.teamB.name)}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function RefsSection({ d, update }) {
  const fields = [
    ["r1", "Referee 1"], ["r2", "Referee 2"], ["clerk", "Recording Clerk"],
    ["a1", "Assistant 1"], ["a2", "Assistant 2"],
  ];
  return (
    <div className="card">
      <h2>Referee team</h2>
      {fields.map(([k, label]) => (
        <div className="field" key={k}>
          <label>{label}</label>
          <input
            value={d.referees[k]}
            onChange={(e) => update((n) => (n.referees[k] = e.target.value))}
            placeholder="Name"
          />
        </div>
      ))}
    </div>
  );
}

function FinishSection({ d, scoring, update }) {
  const sign = (k) => update((n) => (n.signatures[k] = !n.signatures[k]));
  return (
    <>
      <div className="card">
        <h2>Summary</h2>
        <p style={{ fontSize: 18, fontWeight: 700 }}>
          {short(d.teamA.name)} {scoring.setsA} × {scoring.setsB} {short(d.teamB.name)}
        </p>
        <p style={{ color: "var(--muted)" }}>
          {d.sets.map((s) => { const { a, b } = setScore(s); return a + b ? `${a}:${b}` : null; }).filter(Boolean).join("  ·  ") || "No sets recorded yet"}
        </p>
      </div>

      <div className="card">
        <h2>Remarks / extraordinary events</h2>
        <div className="field">
          <textarea rows={3} value={d.remarks} onChange={(e) => update((n) => (n.remarks = e.target.value))} placeholder="Protests, incidents, notes…" />
        </div>
        <div className="field">
          <label>Responsible person</label>
          <input value={d.responsible} onChange={(e) => update((n) => (n.responsible = e.target.value))} placeholder="Name" />
        </div>
      </div>

      <div className="card">
        <h2>Signatures (confirm)</h2>
        {[
          ["capA", `Captain — ${short(d.teamA.name)}`],
          ["capB", `Captain — ${short(d.teamB.name)}`],
          ["referee", "Referee"],
        ].map(([k, label]) => (
          <div className="toggle-row" key={k}>
            <span>{label}</span>
            <button className={`switch ${d.signatures[k] ? "on" : ""}`} onClick={() => sign(k)}>
              {d.signatures[k] ? "Signed" : "Sign"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------- helpers ---------------- */

function short(name) {
  return (name || "").split(" - ")[0];
}

function nextSection(cur) {
  const i = SECTIONS.findIndex(([k]) => k === cur);
  return SECTIONS[Math.min(i + 1, SECTIONS.length - 1)][0];
}

function setScore(s) {
  const r = (s && s.rallies) || [];
  let a = 0, b = 0;
  for (const x of r) { if (x === "A") a++; else if (x === "B") b++; }
  return { a, b };
}

function computeScore(d) {
  if (!d) return { setsA: 0, setsB: 0, winner: null };
  let setsA = 0, setsB = 0;
  for (const s of d.sets) {
    const { a, b } = setScore(s);
    if (a + b === 0) continue;
    if (a > b) setsA++; else if (b > a) setsB++;
  }
  const need = Math.floor((d.info.bestOf) / 2) + 1;
  const winner = setsA >= need ? "A" : setsB >= need ? "B" : null;
  return { setsA, setsB, winner };
}
