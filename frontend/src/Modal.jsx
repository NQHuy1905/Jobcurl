import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

// Accessible dialog: labelled, Esc to close, focus moves in, Tab is trapped, focus returns on close.
export default function Modal({ title, onClose, wide = false, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const first = ref.current?.querySelector("[autofocus], input, textarea") || ref.current?.querySelector(FOCUSABLE);
    first?.focus();
    return () => previous?.focus?.();
  }, []);

  function onKeyDown(e) {
    if (e.key === "Escape") return onClose();
    if (e.key !== "Tab") return;
    const items = [...ref.current.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={onKeyDown}
      >
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
