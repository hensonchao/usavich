/**
 * 通知功能
 */
(function() {
    var notificationManager;
    notificationManager = function(server, pageManager, track) {
        this.init = function() {
            return server.on("notification", function(data) {
                var notification_id;
                if (!chrome.notifications) {
                    return;
                }
                notification_id = "";
                track.event("notification", data.type, "show");
                chrome.notifications.create(notification_id, data.option, function(_id) {
                    return notification_id = _id;
                });
                return chrome.notifications.onClicked.addListener(function(_id) {
                    if (_id === notification_id) {
                        track.event("notification", data.type, "click");
                        if (data.url === "options") {
                            return pageManager.openOptions();
                        } else {
                            return pageManager.openUrl(data.url);
                        }
                    }
                });
            });
        };
        return this;
    };
    define([ "../app", "./server", "./pageManager", "./track" ], function(app) {
        return app.service("notificationManager", notificationManager);
    });
}).call(this);