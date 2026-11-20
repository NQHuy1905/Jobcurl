import { useEffect, useState } from "react";
import { api } from "./api.js";
import MatchPanel from "./MatchPanel.jsx";

function formatDay(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function formatTime(sqliteUtc) {
  if (!sqliteUtc) return "never";
  return new Date(sqliteUtc.replace(" ", "T") + "Z").toLocaleString();
}

export default function CompanyPanel({ company, resume, onScan, onDelete, onNotify }) {
  const [days, setDays] = useState([]);
  const [view, setView] = useState("history"); // "history" | "match"
  const [matchToken, setMatchToken] = useState(0);

  // Reload the history whenever a scan finishes (last_scan_at changes) or the tab changes.
  useEffect(() => {
    let live = true;
    api.history(company.id).then((d) => live && setDays(d));
    return () => {
      live = false;
    };
  }, [company.id, company.last_scan_at, company.scanning]);

  async function findMatch() {
    try {
      await api.startMatch(company.id);
      setMatchToken((t) => t + 1);
    } catch (e) {
      // 409 = a run is already in progress: just show it.
      if (!/already running/i.test(e.message)) {
        onNotify(e.message);
        return;
      }
    }
    setView("match");
  }

  return (
    <section className="panel">
      <header className="panel-head">
        <div>
          <h2>{company.name}</h2>
          <a href={company.url} target="_blank" rel="noreferrer" className="muted">
            {company.url}
          </a>
          <p className="muted small">
            Last scanned: {company.scanning ? "scanning…" : formatTime(company.last_scan_at)} · {company.job_count}{" "}
            positions tracked
          </p>
        </div>
        <div className="row">
          <button
            className="primary"
            disabled={!resume?.has_resume || company.job_count === 0}
            title={resume?.has_resume ? "Score your resume against the latest update" : "Add your resume first"}
            onClick={findMatch}
          >
            Find match
          </button>
          <button className="ghost" disabled={company.scanning} onClick={() => onScan(company.id)}>
            {company.scanning ? "Scanning…" : "Scan now"}
          </button>
          <button
            className="ghost danger"
            onClick={() => window.confirm(`Remove ${company.name} and its history?`) && onDelete(company.id)}
          >
            Remove
          </button>
        </div>
      </header>

      {company.last_error && !company.scanning && <p className="banner">{company.last_error}</p>}

      <div className="subtabs">
        <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}>
          History
        </button>
        <button className={view === "match" ? "active" : ""} onClick={() => setView("match")}>
          Match
        </button>
      </div>

      {view === "match" ? (
        <MatchPanel company={company} resume={resume} token={matchToken} />
      ) : days.length === 0 ? (
        <p className="muted">{company.scanning ? "First scan in progress…" : "No positions recorded yet."}</p>
      ) : (
        days.map((day) => (
          <div className="day" key={day.date}>
            <h4>{formatDay(day.date)}</h4>
            <ul className="dash">
              {day.jobs.map((job) => (
                <li key={job.id}>
                  <details>
                    <summary>
                      {job.title}
                      {job.location && <span className="muted"> — {job.location}</span>}
                    </summary>
                    <div className="desc">
                      {job.description ? <pre>{job.description}</pre> : <p className="muted">No description found.</p>}
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noreferrer">
                          View posting ↗
                        </a>
                      )}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
