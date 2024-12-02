import toast from 'react-hot-toast';

// Success notification with default options
export const notifySuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right'
  });
};

// Error notification with default options
export const notifyError = (message: string) => {
  toast.error(message, {
    duration: 6000,
    position: 'top-right'
  });
};

// Loading notification that can be dismissed
export const notifyLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-right'
  });
};

// Helper to handle API errors
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  const errorMessage = error?.message || 'An unexpected error occurred';
  notifyError(errorMessage);
};

// Helper to dismiss a specific toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};
