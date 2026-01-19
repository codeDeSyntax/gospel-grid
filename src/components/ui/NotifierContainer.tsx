import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { Toaster, Toast, ToastAction } from "../../shared/Notifier";
import {
  removeNotification,
  handleNotificationConfirmation,
  NotificationAction as NotifAction,
} from "../../store/slices/notificationSlice";

export const NotifierContainer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector(
    (state: RootState) => state.notification.notifications
  );

  // Convert Redux notifications to Toast format
  const toasts: Toast[] = notifications.map((notification) => {
    const actions: ToastAction[] = [];

    // Add action buttons if the notification has them
    if (notification.buttons && notification.buttons.length > 0) {
      notification.buttons.forEach((button) => {
        actions.push({
          label: button.text,
          variant: button.variant as "primary" | "secondary" | "danger",
          onClick: () => {
            if (notification.onAction) {
              notification.onAction(button.action);
            }
            // For confirmation dialogs
            if (
              notification.type === "question" &&
              notification.confirmationAction
            ) {
              dispatch(
                handleNotificationConfirmation({
                  notificationId: notification.id,
                  userAction: button.action,
                  confirmationAction: notification.confirmationAction,
                })
              );
            } else {
              // Just remove the notification for non-confirmation notifications
              dispatch(removeNotification(notification.id));
            }
          },
        });
      });
    }

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      duration: notification.autoClose,
      actions,
    };
  });

  // Auto-dismiss notifications
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    notifications.forEach((notification) => {
      if (notification.autoClose && !notification.persistent) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.autoClose);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [notifications, dispatch]);

  const handleDismiss = (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification && !notification.persistent) {
      dispatch(removeNotification(id));
    }
  };

  return (
    <Toaster
      toasts={toasts}
      onDismiss={handleDismiss}
      position="top-right"
      isDarkMode={true}
    />
  );
};
