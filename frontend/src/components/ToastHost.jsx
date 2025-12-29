import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { TOAST_EVENT } from '../utils/toast';

const DEFAULT_DURATION_MS = 3500;

function normalizeFlash(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  return String(value).trim() || null;
}

function toastStyle(type) {
  if (type === 'success') return 'border-emerald-200 bg-emerald-50/90 text-emerald-900';
  if (type === 'error') return 'border-rose-200 bg-rose-50/90 text-rose-900';
  if (type === 'warning') return 'border-amber-200 bg-amber-50/90 text-amber-900';
  return 'border-[#00acb1]/25 bg-white/90 text-[#005963]';
}

export default function ToastHost({ children, initialFlash }) {
  const [flash, setFlash] = useState(initialFlash || {});

  const flashKey = useMemo(() => {
    const success = normalizeFlash(flash?.success);
    const error = normalizeFlash(flash?.error);
    const warning = normalizeFlash(flash?.warning);
    const info = normalizeFlash(flash?.info);
    return JSON.stringify({ success, error, warning, info });
  }, [flash]);

  const lastFlashKeyRef = useRef('');
  const nextIdRef = useRef(1);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', durationMs = DEFAULT_DURATION_MS) => {
    const text = normalizeFlash(message);
    if (!text) return;

    const id = nextIdRef.current++;
    setToasts((prev) => [...prev, { id, type, message: text }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  };

  useEffect(() => {
    // Expose minimal global helpers for non-React code.
    window.toastSuccess = (msg) => addToast(msg, 'success');
    window.toastError = (msg) => addToast(msg, 'error');
    window.toastWarning = (msg) => addToast(msg, 'warning');
    window.toastInfo = (msg) => addToast(msg, 'info');

    return () => {
      delete window.toastSuccess;
      delete window.toastError;
      delete window.toastWarning;
      delete window.toastInfo;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      addToast(detail.message, detail.type || 'info');
    };

    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Keep flash in sync across Inertia navigations.
    const off = router.on('success', (event) => {
      const nextFlash = event?.detail?.page?.props?.flash || {};
      setFlash(nextFlash);
    });

    return () => {
      if (typeof off === 'function') off();
    };
  }, []);

  useEffect(() => {
    if (!flashKey || flashKey === lastFlashKeyRef.current) return;
    lastFlashKeyRef.current = flashKey;

    const success = normalizeFlash(flash?.success);
    const error = normalizeFlash(flash?.error);
    const warning = normalizeFlash(flash?.warning);
    const info = normalizeFlash(flash?.info);

    if (success) addToast(success, 'success');
    if (warning) addToast(warning, 'warning');
    if (error) addToast(error, 'error');
    if (info) addToast(info, 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashKey]);

  return (
    <>
      {children}
      <div className="fixed right-4 top-4 z-[9999] flex w-[92vw] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur ${toastStyle(t.type)}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
