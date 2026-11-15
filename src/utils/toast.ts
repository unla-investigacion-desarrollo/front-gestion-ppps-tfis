export type ToastType = 'info' | 'success' | 'warning' | 'error' | string;

export const showToast = (message: string, type: ToastType = 'info'): void => {
  window.dispatchEvent(
    new CustomEvent('toast', {
      detail: { message, type },
    })
  );
};

