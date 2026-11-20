import { useState } from "react";
import { api } from "./api.js";
import Icon from "./Icon.jsx";
import Modal from "./Modal.jsx";

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
    <Modal title="My resume" onClose={onClose} wide>
      <p className="muted small">
        Kept in memory only while the app is running and never saved to the database. Replacing or removing it clears
        all match results.
      </p>

      <label htmlFor="resume-file">
        <Icon name="file" size={14} /> Upload a PDF, TXT or MD file
      </label>
      <input id="resume-file" type="file" accept=".pdf,.txt,.md" onChange={pickFile} disabled={busy} />
      <p className="hint">The text is extracted so you can review and edit it below.</p>

      <label htmlFor="resume-text">Resume text</label>
      <textarea
        id="resume-text"
        rows={14}
        placeholder="Or paste your resume text here"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        {resume?.has_resume && (
          <button type="button" className="btn danger push-left" disabled={busy} onClick={remove}>
            <Icon name="trash" /> Remove
          </button>
        )}
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary" disabled={busy || !text.trim()} onClick={save}>
          {busy ? "Working…" : "Save resume"}
        </button>
      </div>
    </Modal>
  );
}
