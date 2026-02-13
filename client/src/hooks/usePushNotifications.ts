import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replaceAll('-', '+')
    .replaceAll('_', '/');

  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.codePointAt(i) ?? 0;
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    let isMounted = true;

    const checkSubscription = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in globalThis) {
        if (isMounted) {
          setIsSupported(true);
          setPermission(Notification.permission);
        }

        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (isMounted) {
            setIsSubscribed(!!subscription);
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
    };

    void checkSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  const subscribe = async () => {
    if (!isSupported) return;

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Permission not granted');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to backend
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });

      setIsSubscribed(true);
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return;
    
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
            // Optional: Notify backend to delete subscription, but backend handles 410/404 on send
        }
        setIsSubscribed(false);
    } catch (error) {
        console.error('Failed to unsubscribe:', error);
    }
  };

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe };
}
