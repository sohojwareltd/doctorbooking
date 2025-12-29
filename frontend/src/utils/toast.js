export const TOAST_EVENT = 'app:toast';

export function pushToast(message, type = 'info') {
  if (!message || typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type } }));
}

export function toastSuccess(message) {
  pushToast(message, 'success');
}

export function toastError(message) {
  pushToast(message, 'error');
}

export function toastWarning(message) {
  pushToast(message, 'warning');
}

export function toastInfo(message) {
  pushToast(message, 'info');
}
