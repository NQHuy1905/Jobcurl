import { useState } from "react";
import { api } from "./api.js";

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
    <div className="backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Add company</h2>
        <label>
          Company website or careers page
          <input
            autoFocus
            required
            placeholder="https://company.com/careers"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <label>
          Display name <span className="muted">(optional)</span>
          <input placeholder="Taken from the domain if empty" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row end">
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Adding…" : "Add & scan"}
          </button>
        </div>
      </form>
    </div>
  );
}
