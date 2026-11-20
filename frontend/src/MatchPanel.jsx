import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import Icon from "./Icon.jsx";

const scoreClass = (s) => (s == null ? "none" : s >= 8 ? "high" : s >= 6 ? "mid" : "low");
const decisionClass = (d) => (d ? `d-${d.toLowerCase().replace(/\s+/g, "-")}` : "");

function List({ title, items }) {
  if (!items?.length) return null;
  return (
    <>
      <h5>{title}</h5>
      <ul className="plain">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </>
  );
}

function Details({ r }) {
  return (
    <div className="job-body match-details">
      <p>
        <strong>Why this score:</strong> {r.score_reason}
      </p>
      <p>
        <strong>{r.decision}:</strong> {r.decision_reason}
      </p>

      {r.jd_mapping?.length > 0 && (
        <>
          <h5>JD requirement mapping</h5>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Evidence from resume</th>
                  <th>Match</th>
                  <th>How to improve</th>
                </tr>
              </thead>
              <tbody>
                {r.jd_mapping.map((m, i) => (
                  <tr key={i}>
                    <td>{m.requirement}</td>
                    <td>{m.evidence}</td>
                    <td>
                      <span className={`chip m-${String(m.match).toLowerCase()}`}>{m.match}</span>
                    </td>
                    <td>{m.improve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {r.missing_keywords?.length > 0 && (
        <>
          <h5>Missing keywords (add only if truthful)</h5>
          <div className="chips">
            {r.missing_keywords.map((k, i) => (
              <span className="chip" key={i}>
                {k}
              </span>
            ))}
          </div>
        </>
      )}

      {r.weak_bullets?.length > 0 && (
        <>
          <h5>Weak bullets → improved</h5>
          {r.weak_bullets.map((b, i) => (
            <div className="bullet" key={i}>
              <p className="muted">“{b.quote}”</p>
              <p className="small">Why weak: {b.why_weak}</p>
              <p>
                <strong>Better:</strong> {b.improved}
              </p>
            </div>
          ))}
        </>
      )}

      {r.recommended_summary && (
        <>
          <h5>Recommended summary</h5>
          <p>{r.recommended_summary}</p>
        </>
      )}
      {r.recommended_skills && (
        <>
          <h5>Recommended skills section</h5>
          <p>{r.recommended_skills}</p>
        </>
      )}
      <List title="Top changes to make first" items={r.top_changes} />
      <List title="Interview risk areas" items={r.interview_risks} />
      {r.url && (
        <p>
          <a className="site-link" href={r.url} target="_blank" rel="noreferrer">
            View posting <Icon name="external" size={13} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      )}
    </div>
  );
}

function Band({ children }) {
  return (
    <section className="band-dark" aria-label="Resume match">
      <p className="eyebrow on-dark">
        <span className="dot" /> Resume match
      </p>
      <h3 className="band-title">
        Best match, <em>first.</em>
      </h3>
      {children}
    </section>
  );
}

export default function MatchPanel({ company, resume, token }) {
  const [run, setRun] = useState(null);

  const load = useCallback(() => api.match(company.id).then(setRun).catch(() => {}), [company.id]);

  // Reload on tab change, when "Find match" is clicked (token), or when the resume changes
  // (the server clears results then).
  useEffect(() => {
    setRun(null);
    load();
  }, [load, token, resume?.updated_at]);

  const running = run?.status === "running";
  useEffect(() => {
    if (!running) return;
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [running, load]);

  if (!resume?.has_resume) {
    return (
      <Band>
        <div className="empty-inline">
          <Icon name="file" size={22} />
          <p>Add your resume with the “Add resume” button at the top, then click “Find match”.</p>
        </div>
      </Band>
    );
  }
  if (!run || run.status === "none") {
    return (
      <Band>
        <div className="empty-inline">
          <Icon name="target" size={22} />
          <p>
            Click “Find match” to score your resume against this company’s latest update. Results are kept in memory
            only and disappear when the app stops.
          </p>
        </div>
      </Band>
    );
  }

  return (
    <Band>
      <p className="meta">
        <span>Latest update: {run.job_date}</span>
        <span aria-hidden="true">·</span>
        <span>Resume: {resume.filename || "pasted text"}</span>
        <span aria-hidden="true">·</span>
        <span>Best match first</span>
      </p>
      {running && (
        <div className="progress" role="progressbar" aria-label="Scoring progress" aria-valuemin={0} aria-valuemax={run.total} aria-valuenow={run.done}>
          <div style={{ width: `${(run.done / run.total) * 100}%` }} />
          <span>
            Scoring {run.done}/{run.total}…
          </span>
        </div>
      )}
      {run.error && (
        <p className="banner" role="alert">
          <Icon name="alert" /> {run.error}
        </p>
      )}

      <ul className="matches">
        {run.results.map((r, idx) => (
          <li key={r.job_id}>
            <details>
              <summary>
                <span className="rank" aria-label={`Rank ${idx + 1}`}>
                  {idx + 1}
                </span>
                <span className={`score ${scoreClass(r.score)}`} aria-label={r.score == null ? "Not scored" : `Score ${r.score} out of 10`}>
                  {r.score ?? "–"}
                  {r.score != null && <small>/10</small>}
                </span>
                <span className="match-title">
                  <span className="job-title">{r.title}</span>
                  {r.location && (
                    <span className="job-loc">
                      <Icon name="pin" size={13} /> {r.location}
                    </span>
                  )}
                </span>
                {r.decision && <span className={`chip ${decisionClass(r.decision)}`}>{r.decision}</span>}
                <Icon name="chevron" size={18} />
              </summary>
              {r.error ? (
                <p className="banner" role="alert">
                  <Icon name="alert" /> Scoring failed: {r.error}
                </p>
              ) : (
                <Details r={r} />
              )}
            </details>
          </li>
        ))}
      </ul>
    </Band>
  );
}
