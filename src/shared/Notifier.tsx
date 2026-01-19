import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "question";

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number;
  actions?: ToastAction[];
}

interface ToastItemProps {
  toast: Toast;
  index: number;
  onDismiss: (id: string) => void;
  isDarkMode?: boolean;
}

const ToastItem = React.forwardRef<HTMLDivElement, ToastItemProps>(
  ({ toast, index, onDismiss, isDarkMode = false }, ref) => {
    const config = {
      success: {
        icon: CheckCircle,
        iconColor: "#10b981",
      },
      error: {
        icon: AlertCircle,
        iconColor: "#ef4444",
      },
      warning: {
        icon: AlertTriangle,
        iconColor: "#f59e0b",
      },
      info: {
        icon: Info,
        iconColor: "#3b82f6",
      },
      question: {
        icon: AlertCircle,
        iconColor: "#3b82f6",
      },
    }[toast.type];

    const IconComponent = config.icon;

    const buttonVariants = {
      primary: isDarkMode
        ? "bg-blue-600 hover:bg-blue-500 text-white"
        : "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: isDarkMode
        ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
        : "bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300",
      danger: isDarkMode
        ? "bg-red-600 hover:bg-red-500 text-white"
        : "bg-red-600 hover:bg-red-700 text-white",
    };

    return (
      <div
        ref={ref}
        style={{
          marginBottom: index < 4 ? "12px" : "0",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundColor: isDarkMode ? "#262626" : "#f9fafb",
            borderColor: isDarkMode ? "#404040" : "#e5e5e5",
            boxShadow: isDarkMode
              ? "0 4px 12px rgba(0, 0, 0, 0.5)"
              : "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
          className="border border-solid rounded-2xl flex flex-col gap-2 px-4 py-3 relative"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <IconComponent
              style={{ color: config.iconColor }}
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              strokeWidth={2}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              {toast.title && (
                <div
                  style={{
                    color: isDarkMode ? "#fafafa" : "#171717",
                  }}
                  className="font-semibold text-[15px] mb-1 leading-[1.3]"
                >
                  {toast.title}
                </div>
              )}

              {/* Message */}
              <span
                style={{
                  color: isDarkMode ? "#d4d4d4" : "#404040",
                }}
                className="font-normal text-[14px] leading-[1.4] block"
              >
                {toast.message}
              </span>
            </div>

            {/* Dismiss Button */}
            <div
              onClick={() => onDismiss(toast.id)}
              style={{
                color: isDarkMode ? "#737373" : "#a3a3a3",
              }}
              className="hover:opacity-70 transition-opacity flex-shrink-0 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>

          {/* Action Buttons */}
          {toast.actions && toast.actions.length > 0 && (
            <div className="flex gap-2 mt-1 ml-8">
              {toast.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    action.onClick();
                    onDismiss(toast.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    buttonVariants[action.variant || "secondary"]
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ToastItem.displayName = "ToastItem";

interface ToasterProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?:
    | "top-center"
    | "top-right"
    | "bottom-center"
    | "bottom-right"
    | "top-left"
    | "bottom-left";
  isDarkMode?: boolean;
}

export const Toaster: React.FC<ToasterProps> = ({
  toasts,
  onDismiss,
  position = "top-left",
  isDarkMode = false,
}) => {
  const positionClasses = {
    "top-center": "top-8 left-1/2 -translate-x-1/2",
    "top-right": "top-8 right-4",
    "top-left": "top-8 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-[9999] pointer-events-none`}
      style={{
        width: "min(90vw, 360px)", // Fixed width: ~20% of typical screen or 360px max
      }}
    >
      <div className="flex flex-col pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.slice(0, 5).map((toast, index) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 300, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: 300,
                scale: 0.95,
                transition: { duration: 0.15 },
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              }}
            >
              <ToastItem
                toast={toast}
                index={index}
                onDismiss={onDismiss}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Legacy component for backward compatibility
interface NotificationProps {
  message: string;
  type?: NotificationType;
  show: boolean;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type = "info",
  show,
}) => {
  const toast: Toast = {
    id: "legacy",
    message,
    type,
  };

  return (
    <Toaster
      toasts={show ? [toast] : []}
      onDismiss={() => {}}
      position="top-center"
    />
  );
};
