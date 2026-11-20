import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import AddCompanyModal from "./AddCompanyModal.jsx";
import CompanyPanel from "./CompanyPanel.jsx";
import ResumeModal from "./ResumeModal.jsx";

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [status, setStatus] = useState(null);
  const [adding, setAdding] = useState(false);
  const [resume, setResume] = useState(null); // { has_resume, filename, chars, updated_at, text }
  const [editingResume, setEditingResume] = useState(false);
  const [toast, setToast] = useState("");

  const refresh = useCallback(() => api.companies().then(setCompanies), []);

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

  const next = status?.next_run ? new Date(status.next_run).toLocaleString() : "—";

  return (
    <div className="app">
      <header className="topbar">
        <h1>Jobcurl</h1>
        <div className="row">
          <span className="muted small">Next weekly scan: {next}</span>
          <button
            className="ghost"
            onClick={() =>
              guard(async () => {
                await api.runWeekly();
                await refresh();
              }, "Weekly scan started — new positions will be emailed")
            }
          >
            Run weekly job now
          </button>
          <button className="ghost" onClick={() => setEditingResume(true)}>
            {resume?.has_resume ? `Resume ✓ ${resume.filename || "(pasted)"}` : "Resume"}
          </button>
          <button className="ghost" onClick={() => guard(api.testEmail, `Test email sent to ${status?.email_to}`)}>
            Test email
          </button>
        </div>
      </header>

      {status && !status.llm_configured && (
        <p className="banner">DEEPSEEK_API_KEY is missing in backend/.env — scans will fail.</p>
      )}
      {status && !status.smtp_configured && (
        <p className="banner">SMTP settings are missing in backend/.env — weekly emails cannot be sent.</p>
      )}

      <nav className="tabs">
        {companies.map((c) => (
          <button
            key={c.id}
            className={`tab ${active?.id === c.id ? "active" : ""}`}
            onClick={() => setActiveId(c.id)}
          >
            {c.name}
            {c.scanning ? <span className="dot" title="Scanning" /> : null}
          </button>
        ))}
        <button className="tab add" onClick={() => setAdding(true)}>
          + Add company
        </button>
      </nav>

      {active ? (
        <CompanyPanel company={active} resume={resume} onScan={scan} onDelete={remove} onNotify={notify} />
      ) : (
        <p className="empty">No companies yet. Click “+ Add company” and paste a company website.</p>
      )}

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
            notify(r ? "Resume saved (memory only)" : "Resume removed");
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
