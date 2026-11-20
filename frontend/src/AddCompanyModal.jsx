import { useState } from "react";
import { api } from "./api.js";
import Modal from "./Modal.jsx";

export default function AddCompanyModal({ onClose, onAdded }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onAdded(await api.addCompany(url, name));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Add a company" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="muted small">
          Paste the company website or its careers page. Jobcurl will scan it for current openings and start a history.
        </p>
        <label htmlFor="company-url">
          Website or careers page <span className="req">*</span>
        </label>
        <input
          id="company-url"
          required
          placeholder="https://company.com/careers"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-describedby={error ? "add-error" : undefined}
          aria-invalid={error ? "true" : undefined}
        />
        <label htmlFor="company-name">
          Display name <span className="muted">(optional)</span>
        </label>
        <input
          id="company-name"
          placeholder="Taken from the domain if left empty"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && (
          <p id="add-error" className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {busy ? "Adding…" : "Add and scan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
