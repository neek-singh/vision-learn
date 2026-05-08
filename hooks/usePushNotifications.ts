"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

const VAPID_PUBLIC_KEY = "BP7hk_L8r8pxtnHO2VU4eC993HFvS-jHv2nQta5YR9xG_9OvnsjietcQOKCmB49q2yPo_gJlTw9fvoWHz0A8OVg";

export function usePushNotifications(userId: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    if (userId && Notification.permission === 'granted') {
      registerAndSubscribe();
    }
  }, [userId]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const registerAndSubscribe = async () => {
    if (!userId || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      let sub = await registration.pushManager.getSubscription();

      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      setSubscription(sub);

      // Save to Supabase
      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: sub.toJSON()
        }, { onConflict: 'user_id,subscription' });

    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      await registerAndSubscribe();
    }
  };

  return { permission, subscription, requestPermission };
}
