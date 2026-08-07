import Swal from 'sweetalert2';

/**
 * SweetAlert2 themed to match AIS Control Room dark UI.
 * Provides: showToast, showSuccess, showError, showWarning, showConfirm, showInfo
 */

const darkThemeDefaults = {
  background: '#2b2c30',
  color: '#e4e7eb',
  showConfirmButton: true,
  confirmButtonColor: '#74CD25',
  cancelButtonColor: '#3a3d42',
  customClass: {
    popup: 'swal-dark-popup',
    title: 'swal-dark-title',
    htmlContainer: 'swal-dark-html',
    confirmButton: 'swal-dark-confirm',
    cancelButton: 'swal-dark-cancel',
    backdrop: 'swal-blur-backdrop',
  },
};

// Auto-closing center popup (acting as a toast but with full backdrop)
const Toast = Swal.mixin({
  toast: false,
  position: 'center',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#2b2c30',
  color: '#e4e7eb',
  backdrop: 'rgba(0,0,0,0.4)',
  customClass: {
    popup: 'swal-dark-toast',
    timerProgressBar: 'swal-dark-timer',
    backdrop: 'swal-blur-backdrop',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

/**
 * Show a small toast notification (top-right corner).
 * @param {'success'|'error'|'warning'|'info'} icon
 * @param {string} title
 */
export const showToast = (title, icon = 'success') => {
  Toast.fire({ icon, title });
};

/**
 * Show a centered success popup.
 */
export const showSuccess = (title, text = '') => {
  return Swal.fire({
    ...darkThemeDefaults,
    icon: 'success',
    title,
    text,
    iconColor: '#74CD25',
  });
};

/**
 * Show a centered error popup.
 */
export const showError = (title, text = '') => {
  return Swal.fire({
    ...darkThemeDefaults,
    icon: 'error',
    title,
    text,
    iconColor: '#ef4444',
    confirmButtonColor: '#ef4444',
  });
};

/**
 * Show a centered warning popup.
 */
export const showWarning = (title, text = '') => {
  return Swal.fire({
    ...darkThemeDefaults,
    icon: 'warning',
    title,
    text,
    iconColor: '#f59e0b',
  });
};

/**
 * Show a centered info popup.
 */
export const showInfo = (title, text = '') => {
  return Swal.fire({
    ...darkThemeDefaults,
    icon: 'info',
    title,
    text,
    iconColor: '#38bdf8',
  });
};

/**
 * Show a confirm dialog. Returns true if confirmed.
 */
export const showConfirm = async (title, text = '', confirmText = 'Ya', cancelText = 'Batal') => {
  const result = await Swal.fire({
    ...darkThemeDefaults,
    icon: 'question',
    title,
    text,
    iconColor: '#74CD25',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
};

export default Swal;
