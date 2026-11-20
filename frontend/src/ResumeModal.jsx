import { useState } from "react";
import { api } from "./api.js";

export default function ResumeModal({ resume, onClose, onChanged }) {
  const [text, setText] = useState(resume?.text || "");
  const [filename, setFilename] = useState(resume?.filename || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function pickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const out = await api.extractResume(file);
      setText(out.text);
      setFilename(out.filename || file.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      onChanged(await api.saveResume(text, filename));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.deleteResume();
      onChanged(null);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <h2>My resume</h2>
        <p className="muted small">
          Kept in memory only while the app is running — never saved to the database. Replacing or removing it clears
          all match results.
        </p>
        <label>
          Upload PDF / TXT / MD <span className="muted">(text is extracted so you can review it below)</span>
          <input type="file" accept=".pdf,.txt,.md" onChange={pickFile} disabled={busy} />
        </label>
        <label>
          Resume text
          <textarea
            rows={14}
            placeholder="…or paste your resume text here"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row end">
          {resume?.has_resume && (
            <button type="button" className="ghost danger" disabled={busy} onClick={remove}>
              Remove
            </button>
          )}
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy || !text.trim()} onClick={save}>
            {busy ? "Working…" : "Save resume"}
          </button>
        </div>
      </div>
    </div>
  );
}
