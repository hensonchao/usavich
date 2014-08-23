//图标管理
(function() {
    var badgeManager;
    badgeManager = function($rootScope, $log, $timeout, domainUtils, domainManager, pageManager, timeUtils, MODES, ROLES) {
        var me, oldIcon, updateBadge;
        me = "[badgeManager]";
        oldIcon = null;
        updateBadge = timeUtils.throttle(function() {
            var ICON_ALWAYS, ICON_AUTO, ICON_AUTO_ACTIVE, ICON_BLOCK, ICON_NEVER, count, host, icon, tab, url;
            ICON_NEVER = "/img/icon-never.png";
            ICON_ALWAYS = "/img/icon-always.png";
            ICON_AUTO = "/img/icon-auto.png";
            ICON_BLOCK = "/img/icon-blocked.png";
            ICON_AUTO_ACTIVE = "/img/icon-auto-active.png";
            icon = ICON_AUTO;
            if ($rootScope.needUpgrade) {
                chrome.browserAction.setBadgeBackgroundColor({
                    color:"#17AD08"//绿色
                });
                chrome.browserAction.setPopup({
                    popup:""
                });
                chrome.browserAction.setBadgeText({
                    text:"!"
                });
                icon = ICON_NEVER;
            } else if ($rootScope.conflicts.length > 0) {
                chrome.browserAction.setBadgeBackgroundColor({
                    color:"#F00"//黑色
                });
                chrome.browserAction.setPopup({
                    popup:"popup.html"
                });
                chrome.browserAction.setBadgeText({
                    text:"!"
                });
                icon = ICON_NEVER;
            } else if ($rootScope.user.role === ROLES.GUEST) {
                chrome.browserAction.setBadgeBackgroundColor({
                    color:"#17AD08"//绿色
                });
                chrome.browserAction.setPopup({
                    popup:""
                });
                chrome.browserAction.setBadgeText({
                    text:"?"
                });
                icon = ICON_NEVER;
            } else {
                chrome.browserAction.setBadgeBackgroundColor({
                    color:"#000"//黑色
                });
                chrome.browserAction.setPopup({
                    popup:"popup.html"
                });
                count = $rootScope.blockedDomains.length || 0;
                chrome.browserAction.setBadgeText({
                    text:count > 0 ? count.toString() :""
                });
                tab = $rootScope.currentTab;
                switch ($rootScope.mode) {
                  case MODES.NEVER:
                    icon = ICON_NEVER;
                    break;

                  case MODES.ALWAYS:
                    icon = ICON_ALWAYS;
                    break;

                  default:
                    if (tab != null ? tab.url :void 0) {
                        url = tab.url;
                        host = domainUtils.parseUri(url).host;
                        if (domainManager.coversDomain(host)) {
                            icon = ICON_AUTO_ACTIVE;
                        } else {
                            icon = ICON_AUTO;
                        }
                    } else {
                        icon = ICON_AUTO;
                    }
                }
                if ($rootScope.mode !== MODES.NEVER && $rootScope.blocked) {
                    icon = ICON_BLOCK;
                }
            }
            if (icon !== oldIcon) {
                chrome.browserAction.setIcon({
                    path:icon
                });
                return oldIcon = icon;
            }
        }, 300);
        this.init = function() {
            $rootScope.$watch("conflicts", function() {
                return updateBadge();
            }, true);
            $rootScope.$watch("mode", function() {
                return updateBadge();
            });
            $rootScope.$watch("blocked", function() {
                return updateBadge();
            });
            $rootScope.$watch("domains", function() {
                return updateBadge();
            }, true);
            $rootScope.$watch("currentTab", function() {
                return updateBadge();
            }, true);
            $rootScope.$watch("user.role", updateBadge);
            $rootScope.$watch("needUpgrade", updateBadge);
            return chrome.browserAction.onClicked.addListener(function() {
                if ($rootScope.user.role === ROLES.GUEST) {
                    return pageManager.openLogin("force-login");
                } else if ($rootScope.needUpgrade) {
                    return pageManager.openOptions();
                }
            });
        };
        return this;
    };
    define([ "../app", "underscore", "./domainUtils", "./domainManager", "./pageManager" ], function(app) {
        return app.service("badgeManager", badgeManager);
    });
}).call(this);