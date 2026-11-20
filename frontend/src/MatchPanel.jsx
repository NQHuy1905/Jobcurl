import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

const scoreClass = (s) => (s == null ? "none" : s >= 8 ? "high" : s >= 6 ? "mid" : "low");

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
    <div className="desc match-details">
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
          <a href={r.url} target="_blank" rel="noreferrer">
            View posting ↗
          </a>
        </p>
      )}
    </div>
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
    return <p className="muted">Add your resume with the “Resume” button at the top, then click “Find match”.</p>;
  }
  if (!run || run.status === "none") {
    return (
      <p className="muted">
        Click “Find match” to score your resume against the latest update ({company.job_count} positions tracked).
        Results are kept in memory only and disappear when the app stops.
      </p>
    );
  }

  return (
    <div>
      <p className="muted small">
        Latest update: {run.job_date} · resume: {resume.filename || "pasted text"}
      </p>
      {running && (
        <div className="progress" aria-label="scoring progress">
          <div style={{ width: `${(run.done / run.total) * 100}%` }} />
          <span>
            Scoring {run.done}/{run.total}…
          </span>
        </div>
      )}
      {run.error && <p className="banner">{run.error}</p>}

      <ul className="matches">
        {run.results.map((r) => (
          <li key={r.job_id}>
            <details>
              <summary>
                <span className={`score ${scoreClass(r.score)}`}>{r.score ?? "–"}</span>
                <span className="match-title">
                  {r.title}
                  {r.location && <span className="muted"> — {r.location}</span>}
                </span>
                {r.decision && <span className="chip">{r.decision}</span>}
              </summary>
              {r.error ? <p className="banner">Scoring failed: {r.error}</p> : <Details r={r} />}
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
