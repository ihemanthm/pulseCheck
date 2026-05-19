import { useToast } from '../../context/ToastContext'

export default function Toast() {
  const { toasts, removeToast } = useToast()

  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            rounded-lg shadow-lg p-4 text-white animate-slideInUp
            ${toast.type === 'success' ? 'bg-success-500' : ''}
            ${toast.type === 'error' ? 'bg-danger-500' : ''}
            ${toast.type === 'info' ? 'bg-primary-500' : ''}
            ${toast.type === 'warning' ? 'bg-warning-500' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-lg font-bold hover:opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
