'use client';

import React, { useState, useEffect } from 'react';
import { getVapidPublicKey, savePushSubscription, removePushSubscription, sendTestPushToSelf } from '@/lib/actions/push';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch (err) {
      console.error('Error checking push subscription:', err);
    }
  };

  const handleEnablePush = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setMessage({
          type: 'error',
          text: result === 'denied' 
            ? 'Notification permission was denied. Please unblock notifications in your browser settings.'
            : 'Permission was dismissed.',
        });
        setIsLoading(false);
        return;
      }

      // 2. Fetch VAPID public key
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        setMessage({ type: 'error', text: 'Push service is currently unavailable. VAPID key missing.' });
        setIsLoading(false);
        return;
      }

      // 3. Subscribe with Service Worker
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        const convertedKey = urlBase64ToUint8Array(vapidKey);
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // 4. Save to backend
      const res = await savePushSubscription(subscription.toJSON() as any, navigator.userAgent);
      if (res.success) {
        setIsSubscribed(true);
        setMessage({
          type: 'success',
          text: '🎉 Push notifications enabled! You will get instant alerts on this device.',
        });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to save subscription.' });
      }
    } catch (err: any) {
      console.error('Push registration error:', err);
      setMessage({ type: 'error', text: err?.message || 'Failed to enable push notifications.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      setMessage({ type: 'info', text: 'Push notifications disabled for this device.' });
    } catch (err: any) {
      console.error('Error disabling push:', err);
      setMessage({ type: 'error', text: err?.message || 'Error disabling notifications.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setIsTesting(true);
    setMessage(null);
    try {
      const res = await sendTestPushToSelf();
      if (res.success) {
        setMessage({
          type: 'success',
          text: '🚀 ' + (res.message || 'Test push sent! Check your notification tray or lockscreen.'),
        });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to send test push.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error sending test push.' });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isSupported) {
    return (
      <div style={{
        padding: '1.25rem',
        borderRadius: '12px',
        background: 'rgba(255, 170, 0, 0.08)',
        border: '1px solid rgba(255, 170, 0, 0.25)',
        color: '#ffc107',
        fontSize: '0.9rem',
        lineHeight: 1.5,
        marginBottom: '1.5rem',
      }}>
        <strong>💡 Note for iPhone / iOS:</strong> Push notifications require adding StageHost to your Home Screen first (tap Share ➔ Add to Home Screen in Safari), then launching it as an App.
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '14px',
      padding: '1.5rem',
      marginBottom: '2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.2rem' }}>📲</span>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
              Device Push Notifications (Instant Lockscreen Alerts)
            </h4>
            {isSubscribed && (
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}>
                ACTIVE
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', maxWidth: '520px', lineHeight: 1.5 }}>
            Get instant native push alerts on your phone or desktop tray even when your screen is locked or browser is closed whenever a new client books or inquires.
          </p>
        </div>

        <div>
          {isSubscribed ? (
            <button
              onClick={handleDisablePush}
              disabled={isLoading}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? 'Updating...' : 'Disable on this device'}
            </button>
          ) : (
            <button
              onClick={handleEnablePush}
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? 'Enabling...' : '🔔 Enable Push Alerts'}
            </button>
          )}
        </div>
      </div>

      {isSubscribed && (
        <div style={{
          marginTop: '1.2rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Device status: Connected via WebPush Service Worker
          </span>
          <button
            onClick={handleSendTestPush}
            disabled={isTesting}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {isTesting ? 'Sending push...' : '⚡ Send Test Push Notification'}
          </button>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          background: message.type === 'success'
            ? 'rgba(16, 185, 129, 0.1)'
            : message.type === 'error'
            ? 'rgba(239, 68, 68, 0.1)'
            : 'rgba(59, 130, 246, 0.1)',
          color: message.type === 'success'
            ? '#34d399'
            : message.type === 'error'
            ? '#f87171'
            : '#60a5fa',
          border: `1px solid ${
            message.type === 'success'
              ? 'rgba(16, 185, 129, 0.25)'
              : message.type === 'error'
              ? 'rgba(239, 68, 68, 0.25)'
              : 'rgba(59, 130, 246, 0.25)'
          }`,
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
