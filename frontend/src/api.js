async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  status: () => request("/status"),
  companies: () => request("/companies"),
  addCompany: (url, name) =>
    request("/companies", { method: "POST", body: JSON.stringify({ url, name: name || null }) }),
  deleteCompany: (id) => request(`/companies/${id}`, { method: "DELETE" }),
  history: (id) => request(`/companies/${id}/history`),
  scan: (id) => request(`/companies/${id}/scan`, { method: "POST" }),
  runWeekly: () => request("/run-weekly", { method: "POST" }),
  testEmail: () => request("/test-email", { method: "POST" }),

  // Resume + match live only in backend memory (never in the database).
  resume: () => request("/resume"),
  saveResume: (text, filename) => request("/resume", { method: "PUT", body: JSON.stringify({ text, filename }) }),
  deleteResume: () => request("/resume", { method: "DELETE" }),
  extractResume: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/resume/extract", { method: "POST", body: form, headers: {} }); // browser sets the multipart boundary
  },
  startMatch: (id) => request(`/companies/${id}/match`, { method: "POST" }),
  match: (id) => request(`/companies/${id}/match`),
};
