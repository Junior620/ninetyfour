/* Optional push only. No fetch handler and no cache of private resources. */
self.addEventListener("push",event=>{event.waitUntil(self.registration.showNotification("N91 MatchLab",{body:"Une mise à jour est disponible dans votre espace privé.",tag:"matchlab-update",data:{url:"/matchlab/alerts"}}));});
self.addEventListener("notificationclick",event=>{event.notification.close();event.waitUntil(clients.openWindow("/matchlab/alerts"));});
