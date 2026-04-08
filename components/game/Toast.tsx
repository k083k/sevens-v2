import { useEffect, useState } from "react";
import { X, AlertCircle, Info, CheckCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "info" | "warning" | "success";
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "info", duration = 4000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  };

  const bgColors = {
    info: "bg-blue-950/80 border-blue-800",
    warning: "bg-amber-950/80 border-amber-800",
    success: "bg-emerald-950/80 border-emerald-800",
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
        ${bgColors[type]}
        ${isExiting ? "animate-slide-out-right" : "animate-slide-in-right"}
        min-w-[300px] max-w-[400px]
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <p className="flex-1 text-sm text-slate-100">
        {message}
      </p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: "info" | "warning" | "success" }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
