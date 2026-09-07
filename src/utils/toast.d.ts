export type ToastType = 'success' | 'error' | 'info' | 'warning' | string;

export declare const showToast: (message: string, type?: ToastType) => void;