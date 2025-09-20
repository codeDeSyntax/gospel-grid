import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  AlertCircle,
} from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info" | "question";
export type NotificationAction = "confirm" | "cancel" | "dismiss";

export interface NotificationButton {
  text: string;
  action: NotificationAction;
  variant?: "primary" | "secondary" | "danger";
}

export interface NotificationConfig {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: React.ReactNode;
  buttons?: NotificationButton[];
  autoClose?: number; // milliseconds, 0 = no auto close
  persistent?: boolean; // prevents closing by clicking outside or ESC
  onAction?: (action: NotificationAction) => void;
}

interface NotificationModalProps {
  notifications: NotificationConfig[];
  onClose: (id: string, action?: NotificationAction) => void;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: "from-emerald-500/10 via-green-500/5 to-emerald-600/10",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    titleColor: "text-emerald-100",
  },
  error: {
    icon: XCircle,
    bgColor: "from-red-500/10 via-rose-500/5 to-red-600/10",
    borderColor: "border-red-500/30",
    iconColor: "text-red-400",
    titleColor: "text-red-100",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "from-amber-500/10 via-yellow-500/5 to-orange-600/10",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    titleColor: "text-amber-100",
  },
  info: {
    icon: Info,
    bgColor: "from-blue-500/10 via-cyan-500/5 to-blue-600/10",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
    titleColor: "text-blue-100",
  },
  question: {
    icon: AlertCircle,
    bgColor: "from-purple-500/10 via-violet-500/5 to-purple-600/10",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-400",
    titleColor: "text-purple-100",
  },
};

const buttonVariants = {
  primary: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white",
  secondary: "bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 border border-slate-600/50",
  danger: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white",
};

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications,
  onClose,
}) => {
  const [closingIds, setClosingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const persistentNotifications = notifications.filter(n => n.persistent);
        if (persistentNotifications.length === 0) {
          // Close the most recent non-persistent notification
          const latestNotification = notifications[notifications.length - 1];
          if (latestNotification && !latestNotification.persistent) {
            handleClose(latestNotification.id || "", "cancel");
          }
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [notifications]);

  const handleClose = (id: string, action: NotificationAction = "dismiss") => {
    const notification = notifications.find(n => n.id === id);
    
    setClosingIds(prev => new Set([...prev, id]));
    
    setTimeout(() => {
      notification?.onAction?.(action);
      onClose(id, action);
      setClosingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 150);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          const latestNotification = notifications[notifications.length - 1];
          if (latestNotification && !latestNotification.persistent) {
            handleClose(latestNotification.id || "", "cancel");
          }
        }}
      />

      <AnimatePresence mode="wait">
        {notifications.map((notification, index) => {
          const config = typeConfig[notification.type];
          const IconComponent = notification.icon 
            ? () => notification.icon as React.ReactElement
            : config.icon;
          const id = notification.id || `notification-${index}`;
          const isClosing = closingIds.has(id);

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: isClosing ? 0 : 1, 
                scale: isClosing ? 0.95 : 1, 
                y: isClosing ? -10 : 0 
              }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                duration: isClosing ? 0.15 : 0.3
              }}
              className={`
                relative max-w-md w-full mx-4 p-6 rounded-2xl
                backdrop-blur-xl bg-gradient-to-br ${config.bgColor}
                border ${config.borderColor} shadow-2xl shadow-black/50
                ${index < notifications.length - 1 ? 'pointer-events-none opacity-60' : ''}
              `}
              style={{
                transform: `translateZ(${index * 10}px)`,
              }}
            >
              {/* Close button for non-persistent notifications */}
              {!notification.persistent && (
                <button
                  onClick={() => handleClose(id, "cancel")}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200"
                >
                  <X size={16} />
                </button>
              )}

              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`flex-shrink-0 ${config.iconColor}`}>
                  <IconComponent size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-semibold ${config.titleColor} mb-1`}>
                    {notification.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              {notification.buttons && notification.buttons.length > 0 && (
                <div className="flex gap-3 justify-end mt-6">
                  {notification.buttons.map((button, btnIndex) => (
                    <button
                      key={btnIndex}
                      onClick={() => handleClose(id, button.action)}
                      className={`
                        px-4 py-2 rounded-lg font-medium text-sm
                        transition-all duration-200 hover:scale-105 active:scale-95
                        ${buttonVariants[button.variant || "secondary"]}
                        shadow-lg backdrop-blur-sm
                      `}
                    >
                      {button.text}
                    </button>
                  ))}
                </div>
              )}

              {/* Auto-close progress bar */}
              {notification.autoClose && notification.autoClose > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-2xl overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: notification.autoClose / 1000, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    onAnimationComplete={() => handleClose(id, "dismiss")}
                  />
                </div>
              )}

              {/* Shimmer effect */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div 
                  className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%]"
                  style={{
                    animation: 'shimmer 3s ease-in-out infinite',
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
      `}</style>
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);

  const showNotification = (config: Omit<NotificationConfig, "id">) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: NotificationConfig = { ...config, id };

    setNotifications(prev => [...prev, notification]);

    // Auto-close if specified
    if (config.autoClose && config.autoClose > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, config.autoClose);
    }

    return id;
  };

  const closeNotification = (id: string, action?: NotificationAction) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    showNotification,
    closeNotification,
    clearAll,
  };
};