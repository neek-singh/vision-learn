self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: 'https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png',
      badge: 'https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/notifications'
      },
      actions: [
        { action: 'open', title: 'View Details' },
        { action: 'close', title: 'Close' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
