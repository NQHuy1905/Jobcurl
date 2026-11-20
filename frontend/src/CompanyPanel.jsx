import { useEffect, useState } from "react";
import { api } from "./api.js";
import Icon from "./Icon.jsx";
import MatchPanel from "./MatchPanel.jsx";

function formatDay(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(sqliteUtc) {
  if (!sqliteUtc) return "never";
  return new Date(sqliteUtc.replace(" ", "T") + "Z").toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShort(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function hostOf(url) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function CompanyPanel({ company, resume, onScan, onDelete, onNotify }) {
  const [days, setDays] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [view, setView] = useState("history"); // "history" | "match"
  const [matchToken, setMatchToken] = useState(0);

  useEffect(() => setHistoryLoaded(false), [company.id]);

  // Reload the history whenever a scan finishes (last_scan_at changes) or the tab changes.
  useEffect(() => {
    let live = true;
    api.history(company.id).then((d) => {
      if (live) {
        setDays(d);
        setHistoryLoaded(true);
      }
    });
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

  const canMatch = resume?.has_resume && company.job_count > 0;

  return (
    <section className="panel" id="panel" role="tabpanel" aria-labelledby={`tab-${company.id}`}>
      <header className="panel-head">
        <div className="panel-title">
          <p className="eyebrow">
            <span className="dot" /> Company
          </p>
          <h2>{company.name}</h2>
          <a href={company.url} target="_blank" rel="noreferrer" className="site-link">
            {hostOf(company.url)} <Icon name="external" size={13} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <div className="panel-actions">
          <button
            className="btn pill primary"
            disabled={!canMatch}
            title={
              !resume?.has_resume
                ? "Add your resume first"
                : company.job_count === 0
                  ? "No positions to score yet"
                  : "Score your resume against the latest update"
            }
            onClick={findMatch}
          >
            <Icon name="target" /> Find match
          </button>
          <button className="btn pill" disabled={company.scanning} onClick={() => onScan(company.id)}>
            <Icon name="refresh" /> {company.scanning ? "Scanning…" : "Scan now"}
          </button>
          <button
            className="btn pill danger-ghost"
            aria-label={`Remove ${company.name}`}
            onClick={() => window.confirm(`Remove ${company.name} and its history?`) && onDelete(company.id)}
          >
            <Icon name="trash" />
          </button>
        </div>
      </header>

      <dl className="stats">
        <div>
          <dt>Positions tracked</dt>
          <dd>{company.job_count}</dd>
        </div>
        <div>
          <dt>Latest update</dt>
          <dd>{days[0] ? formatShort(days[0].date) : "—"}</dd>
        </div>
        <div>
          <dt>Last scanned</dt>
          <dd className="stat-small">{company.scanning ? "Scanning…" : formatTime(company.last_scan_at)}</dd>
        </div>
      </dl>

      {company.last_error && !company.scanning && (
        <p className="banner" role="alert">
          <Icon name="alert" /> {company.last_error}
        </p>
      )}

      <div className="subtabs" role="group" aria-label="Company views">
        <button className={view === "history" ? "active" : ""} aria-pressed={view === "history"} onClick={() => setView("history")}>
          Update history
        </button>
        <button className={view === "match" ? "active" : ""} aria-pressed={view === "match"} onClick={() => setView("match")}>
          Resume match
        </button>
      </div>

      {view === "match" ? (
        <MatchPanel company={company} resume={resume} token={matchToken} />
      ) : !historyLoaded ? (
        <div className="skeleton-list" aria-busy="true" aria-label="Loading history">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton short" />
        </div>
      ) : days.length === 0 ? (
        <div className="empty-inline">
          <Icon name="inbox" size={22} />
          <p>{company.scanning ? "First scan in progress…" : "No positions recorded yet. Use “Scan now” to check."}</p>
        </div>
      ) : (
        days.map((day) => (
          <div className="day" key={day.date}>
            <h3>
              {formatDay(day.date)} <span className="day-count">{day.jobs.length} new</span>
            </h3>
            <ul className="jobs">
              {day.jobs.map((job) => (
                <li key={job.id}>
                  <details>
                    <summary>
                      <span className="job-main">
                        <span className="job-title">{job.title}</span>
                        {job.location && (
                          <span className="job-loc">
                            <Icon name="pin" size={13} /> {job.location}
                          </span>
                        )}
                      </span>
                      <Icon name="chevron" size={18} />
                    </summary>
                    <div className="job-body">
                      {job.description ? <pre>{job.description}</pre> : <p className="muted">No description found.</p>}
                      {job.url && (
                        <a className="site-link" href={job.url} target="_blank" rel="noreferrer">
                          View posting <Icon name="external" size={13} />
                          <span className="sr-only"> (opens in a new tab)</span>
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
