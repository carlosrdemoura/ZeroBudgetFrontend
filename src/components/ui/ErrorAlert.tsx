import { AxiosError } from 'axios';

interface Props {
  error: unknown | string;
  className?: string;
}

export function ErrorAlert({ error, className }: Props) {
  let message = 'An unexpected error occurred.';

  if (error instanceof AxiosError) {
    const data = error.response?.data as { title?: string; errors?: Record<string, string[]> };
    if (data?.errors) {
      const msgs = Object.values(data.errors).flat();
      message = msgs.join(' ');
    } else if (data?.title) {
      message = data.title;
    } else if (error.message) {
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div role="alert" className={`alert alert-error text-sm ${className ?? ''}`.trim()}>
      <svg xmlns="http://www.w3.org/2000/svg" className="shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
