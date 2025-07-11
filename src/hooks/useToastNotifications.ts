import { useToast, ToastType } from '@/contexts/ToastContext';

export function useToastNotifications() {
  const { addToast } = useToast();

  const showToast = (
    type: ToastType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    addToast({
      type,
      title,
      message,
      duration: options?.duration,
      action: options?.action,
    });
  };

  const success = (title: string, message?: string, duration?: number) => {
    showToast('success', title, message, { duration });
  };

  const error = (title: string, message?: string, duration?: number) => {
    showToast('error', title, message, { duration });
  };

  const warning = (title: string, message?: string, duration?: number) => {
    showToast('warning', title, message, { duration });
  };

  const info = (title: string, message?: string, duration?: number) => {
    showToast('info', title, message, { duration });
  };

  // Common patterns for specific actions
  const csvExportSuccess = (filename: string) => {
    success(
      'Export Successful',
      `${filename} has been downloaded successfully.`,
      4000
    );
  };

  const csvExportError = (error?: string) => {
    showToast(
      'error',
      'Export Failed',
      error || 'Failed to export CSV file. Please try again.',
      { duration: 6000 }
    );
  };

  const apiError = (action: string, error?: string) => {
    showToast(
      'error',
      `${action} Failed`,
      error || 'An unexpected error occurred. Please try again.',
      { duration: 6000 }
    );
  };

  const apiSuccess = (action: string, message?: string) => {
    success(
      `${action} Successful`,
      message,
      4000
    );
  };

  return {
    showToast,
    success,
    error,
    warning,
    info,
    csvExportSuccess,
    csvExportError,
    apiError,
    apiSuccess,
  };
}
