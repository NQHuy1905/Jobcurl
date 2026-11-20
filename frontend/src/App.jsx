import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import AddCompanyModal from "./AddCompanyModal.jsx";
import { accentFor, HeroArt, Logo, TileArt } from "./Art.jsx";
import CompanyPanel from "./CompanyPanel.jsx";
import Icon from "./Icon.jsx";
import ResumeModal from "./ResumeModal.jsx";

const STEPS = [
  { kind: "watch", n: "01", title: "Paste a careers page", text: "Add any company website. Jobcurl reads the page and records every open role it finds." },
  { kind: "digest", n: "02", title: "Get Monday's digest", text: "Each week it rescans and emails you only the roles that are new, so nothing slips by." },
  { kind: "match", n: "03", title: "Score your resume", text: "Add your resume once and see which openings fit best, ranked, with what to improve." },
];

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [status, setStatus] = useState(null);
  const [adding, setAdding] = useState(false);
  const [resume, setResume] = useState(null); // { has_resume, filename, chars, updated_at, text }
  const [editingResume, setEditingResume] = useState(false);
  const [toast, setToast] = useState("");

  const refresh = useCallback(
    () =>
      api
        .companies()
        .then(setCompanies)
        .finally(() => setLoaded(true)),
    [],
  );

  useEffect(() => {
    refresh();
    api.status().then(setStatus);
    api.resume().then(setResume).catch(() => {});
  }, [refresh]);

  // Poll quickly while any scan runs.
  const anyScanning = companies.some((c) => c.scanning);
  useEffect(() => {
    if (!anyScanning) return;
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [anyScanning, refresh]);

  const active = companies.find((c) => c.id === activeId) || companies[0];

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function guard(fn, okMsg) {
    try {
      await fn();
      if (okMsg) notify(okMsg);
    } catch (e) {
      notify(e.message);
    }
  }

  const scan = (id) =>
    guard(async () => {
      await api.scan(id);
      setCompanies((cs) => cs.map((c) => (c.id === id ? { ...c, scanning: 1 } : c)));
    });

  const remove = (id) =>
    guard(async () => {
      await api.deleteCompany(id);
      setActiveId(null);
      await refresh();
    });

  // Arrow keys move between company tabs (WAI-ARIA tabs pattern).
  function onTabKeyDown(e) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step || !companies.length) return;
    e.preventDefault();
    const i = companies.findIndex((c) => c.id === active?.id);
    const next = companies[(i + step + companies.length) % companies.length];
    setActiveId(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  const next = status?.next_run
    ? new Date(status.next_run).toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "soon";

  const resumeButton = (
    <button className={`btn pill ${resume?.has_resume ? "" : "primary"}`} onClick={() => setEditingResume(true)}>
      <Icon name={resume?.has_resume ? "check" : "file"} />
      <span className="btn-label">{resume?.has_resume ? `Resume: ${resume.filename || "pasted text"}` : "Add resume"}</span>
    </button>
  );

  return (
    <>
      <div className="shell">
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        <header className="topbar">
          <a className="brand" href="/" aria-label="Jobcurl home">
            <Logo />
            <span>jobcurl</span>
          </a>
          <div className="top-actions">{resumeButton}</div>
        </header>

        <div className="banners">
          {status && !status.llm_configured && (
            <p className="banner" role="alert">
              <Icon name="alert" /> DEEPSEEK_API_KEY is missing in backend/.env, so scans will fail.
            </p>
          )}
          {status && !status.smtp_configured && (
            <p className="banner" role="alert">
              <Icon name="alert" /> SMTP settings are missing in backend/.env, so weekly emails cannot be sent.
            </p>
          )}
        </div>

        <main id="main">
          {active ? (
            <div className="layout">
              <aside className="sidebar" aria-label="Companies">
                <p className="eyebrow">
                  <span className="dot" /> Companies
                </p>
                <div className="tablist" role="tablist" aria-orientation="vertical" onKeyDown={onTabKeyDown}>
                  {companies.map((c) => {
                    const a = accentFor(c.id);
                    return (
                      <button
                        key={c.id}
                        id={`tab-${c.id}`}
                        role="tab"
                        aria-selected={active.id === c.id}
                        aria-controls="panel"
                        tabIndex={active.id === c.id ? 0 : -1}
                        className={`company-tab ${active.id === c.id ? "active" : ""}`}
                        onClick={() => setActiveId(c.id)}
                      >
                        <span className="avatar" style={{ background: a.bg, color: a.fg }} aria-hidden="true">
                          {c.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="tab-name">{c.name}</span>
                        {c.scanning ? (
                          <span className="spinner" role="img" aria-label="Scanning" />
                        ) : (
                          <span className="count" aria-label={`${c.job_count} positions`}>
                            {c.job_count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button className="btn pill add-company" onClick={() => setAdding(true)}>
                  <Icon name="plus" /> Add company
                </button>
              </aside>

              <div className="content">
                <CompanyPanel company={active} resume={resume} onScan={scan} onDelete={remove} onNotify={notify} />
              </div>
            </div>
          ) : (
            loaded && (
              <>
                <section className="hero">
                  <div className="hero-copy">
                    <p className="eyebrow">
                      <span className="dot" /> Job watch for job seekers
                    </p>
                    <h1>
                      Every opening.
                      <br />
                      <em>Tracked.</em>
                    </h1>
                    <p className="lede">
                      Paste a company’s careers page. Jobcurl watches for new roles, emails you on Monday, and scores your
                      resume against each one.
                    </p>
                    <div className="cta-row">
                      <button className="btn pill primary lg" onClick={() => setAdding(true)}>
                        Add your first company <Icon name="arrow" />
                      </button>
                      <button className="btn pill lg" onClick={() => setEditingResume(true)}>
                        <Icon name="file" /> {resume?.has_resume ? "Update resume" : "Add resume"}
                      </button>
                    </div>
                    <p className="fineprint">Per-day history · Weekly email · Resume scoring</p>
                  </div>
                  <div className="hero-art">
                    <HeroArt />
                  </div>
                </section>

                <section className="steps" aria-label="How it works">
                  <p className="eyebrow">
                    <span className="dot" /> How it works
                  </p>
                  <h2 className="section-title">
                    Three steps. <em>Zero</em> tab-hopping.
                  </h2>
                  <ol className="step-grid">
                    {STEPS.map((s) => (
                      <li key={s.n} className="step">
                        <div className="step-art">
                          <TileArt kind={s.kind} />
                        </div>
                        <p className="step-n">{s.n}</p>
                        <h3>{s.title}</h3>
                        <p>{s.text}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              </>
            )
          )}
        </main>
      </div>

      <section className="cta-band" aria-labelledby="cta-title">
        <div className="inner">
          <p className="eyebrow on-dark">
            <span className="dot" /> Weekly digest
          </p>
          <h2 id="cta-title">
            Never miss an <em>opening.</em>
          </h2>
          <p className="lede">
            The next scan runs {next}. Any new roles land in your inbox
            {status?.email_to ? ` at ${status.email_to}` : ""}.
          </p>
          <div className="cta-row center">
            <button
              className="btn pill light lg"
              onClick={() =>
                guard(async () => {
                  await api.runWeekly();
                  await refresh();
                }, "Weekly scan started. New positions will be emailed.")
              }
            >
              <Icon name="play" size={15} /> Run weekly scan now
            </button>
            <button className="btn pill outline-light lg" onClick={() => guard(api.testEmail, `Test email sent to ${status?.email_to}`)}>
              <Icon name="mail" /> Send test email
            </button>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="inner footer-row">
          <p>Jobcurl tracks career pages, keeps the history, and scores your resume.</p>
          <a href="#main">
            Back to top <Icon name="arrow-up" size={15} />
          </a>
        </div>
        <p className="wordmark" aria-hidden="true">
          jobcurl
        </p>
      </footer>

      {adding && (
        <AddCompanyModal
          onClose={() => setAdding(false)}
          onAdded={(c) => {
            setAdding(false);
            setActiveId(c.id);
            refresh();
          }}
        />
      )}
      {editingResume && (
        <ResumeModal
          resume={resume}
          onClose={() => setEditingResume(false)}
          onChanged={(r) => {
            setResume(r || { has_resume: false });
            setEditingResume(false);
            notify(r ? "Resume saved (kept in memory only)" : "Resume removed");
          }}
        />
      )}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
