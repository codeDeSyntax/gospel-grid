import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  AlertCircle,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import {
  NotificationConfig,
  NotificationAction,
  removeNotification,
  updateNotificationAction,
  handleNotificationConfirmation,
} from "../../store/slices/notificationSlice";

const NotificationModalComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector(
    (state: RootState) => state.notification.notifications
  );
  const [closingIds, setClosingIds] = useState<Set<string>>(new Set());

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
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white",
    secondary:
      "bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 border border-slate-600/50",
    danger:
      "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white",
  };

  const handleClose = (id: string, action: NotificationAction = "dismiss") => {
    const notification = notifications.find((n) => n.id === id);

    // Check if this is a special confirmation notification
    if (
      notification?.confirmationAction &&
      (action === "confirm" || action === "cancel")
    ) {
      console.log(
        `🎬 Handling confirmation action: ${action} for ${notification.confirmationAction}`
      );
      dispatch(
        handleNotificationConfirmation({
          notificationId: id,
          userAction: action,
          confirmationAction: notification.confirmationAction,
        })
      );
    } else {
      // Call the onAction callback if it exists (for backward compatibility)
      if (notification?.onAction) {
        notification.onAction(action);
      }

      // Remove the notification from Redux store
      dispatch(removeNotification(id));
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const persistentNotifications = notifications.filter(
          (n) => n.persistent
        );
        if (persistentNotifications.length === 0) {
          // Close the most recent non-persistent notification
          const latestNotification = notifications[notifications.length - 1];
          if (latestNotification && !latestNotification.persistent) {
            handleClose(latestNotification.id, "cancel");
          }
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [notifications]);

  // Auto-close notifications
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    notifications.forEach((notification) => {
      if (notification.autoClose && notification.autoClose > 0) {
        const timer = setTimeout(() => {
          handleClose(notification.id, "dismiss");
        }, notification.autoClose);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [notifications]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm"
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
                y: isClosing ? -10 : 0,
              }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: isClosing ? 0.15 : 0.3,
              }}
              className={`
                relative max-w-md w-full mx-4 p-6 rounded-2xl
                backdrop-blur-md bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 ${
                  config.bgColor
                }
                border ${config.borderColor} shadow-2xl shadow-blue-500/10
                ${
                  index < notifications.length - 1
                    ? "pointer-events-none opacity-60"
                    : ""
                }
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
                  <h3
                    className={`text-lg font-semibold ${config.titleColor} mb-1`}
                  >
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
                    transition={{
                      duration: notification.autoClose / 1000,
                      ease: "linear",
                    }}
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
                    animation: "shimmer 3s ease-in-out infinite",
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
    const id = `notification-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const notification: NotificationConfig = { ...config, id };

    setNotifications((prev: NotificationConfig[]) => [...prev, notification]);

    // Auto-close if specified
    if (config.autoClose && config.autoClose > 0) {
      setTimeout(() => {
        setNotifications((prev: NotificationConfig[]) =>
          prev.filter((n: NotificationConfig) => n.id !== id)
        );
      }, config.autoClose);
    }

    return id;
  };

  const closeNotification = (id: string, action?: NotificationAction) => {
    setNotifications((prev: NotificationConfig[]) =>
      prev.filter((n: NotificationConfig) => n.id !== id)
    );
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

export { NotificationModalComponent };
