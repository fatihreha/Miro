
export const notificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notification");
      return false;
    }
    
    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  },

  getPermissionStatus: (): NotificationPermission => {
    if (!("Notification" in window)) return "denied";
    return Notification.permission;
  },

  showNotification: (title: string, options?: NotificationOptions) => {
    if (Notification.permission === "granted") {
      try {
        // Simple vibration pattern for mobile if supported
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        const n = new Notification(title, {
          icon: 'https://cdn-icons-png.flaticon.com/512/1077/1077063.png', // Generic user icon
          badge: 'https://cdn-icons-png.flaticon.com/512/1077/1077063.png',
          ...options
        });
        
        // Auto close after 4 seconds
        setTimeout(n.close.bind(n), 4000);
      } catch (e) {
        console.error("Notification trigger failed", e);
      }
    }
  }
};
