export const showToast = (message, type = 'info') => {
  window.dispatchEvent(new CustomEvent('toast', {
    detail: { message, type },
  }));
};