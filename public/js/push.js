(function () {
  const btn = document.getElementById('push-toggle-btn');
  if (!btn) return;

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from(Array.prototype.map.call(rawData, (c) => c.charCodeAt(0)));
  }

  async function refreshButtonState() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      btn.textContent = 'התראות לא נתמכות בדפדפן הזה';
      btn.disabled = true;
      return;
    }
    if (Notification.permission === 'denied') {
      btn.textContent = 'התראות חסומות — יש לאפשר בהגדרות הדפדפן';
      btn.disabled = true;
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      btn.textContent = '🔔 התראות פעילות';
      btn.classList.add('subscribed');
    } else {
      btn.textContent = '🔔 הפעל התראות';
      btn.classList.remove('subscribed');
    }
  }

  async function subscribe() {
    btn.disabled = true;
    try {
      const keyRes = await fetch('/api/push/public-key');
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        alert('התראות לא מוגדרות בשרת כרגע');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
    } catch (err) {
      alert('לא הצלחנו להפעיל התראות: ' + err.message);
    } finally {
      await refreshButtonState();
      btn.disabled = false;
    }
  }

  btn.addEventListener('click', () => {
    if (!btn.classList.contains('subscribed')) subscribe();
  });

  refreshButtonState();
})();
