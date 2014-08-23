(function() {
    var libs, tabsTracker;
    tabsTracker = function($rootScope, $log, teleScope, domainUtils, domainManager) {
        var REQUEST_TIMEOUT, onBeforeRequest, onDomainsChanged, onHeadersReceived, onRequestErrorOccurred, onTabActivated, onTabRemoved, onWindowFocusChanged, setTabInfo, tabsMap, trackRequestTimeout;
        REQUEST_TIMEOUT = 5 * 1e3;
        tabsMap = {};
        setTabInfo = function(id, url, domain, domainStatus) {
            var dirty, tabInfo;
            if (url == null) {
                url = null;
            }
            if (domain == null) {
                domain = null;
            }
            if (domainStatus == null) {
                domainStatus = null;
            }
            dirty = false;
            tabInfo = tabsMap[id];
            if (!tabInfo) {
                tabInfo = {
                    id:id,
                    url:"",
                    domains:{}
                };
                tabsMap[id] = tabInfo;
                dirty = true;
            }
            if (url) {
                tabInfo.url = url;
                dirty = true;
            }
            if (domain) {
                if (domainStatus === "timeout") {
                    if (tabInfo.domains[domain] === "pending") {
                        tabInfo.domains[domain] = "timeout";
                        dirty = true;
                    }
                } else if (domainStatus !== "pending") {
                    tabInfo.domains[domain] = domainStatus;
                    dirty = true;
                } else if (!tabInfo.domains[domain]) {
                    tabInfo.domains[domain] = domainStatus;
                    dirty = true;
                }
            }
            if (!tabInfo.url) {
                chrome.tabs.get(id, function(tab) {
                    if (!tab) {
                        return;
                    }
                    tabInfo.url = tab.url;
                    return $rootScope.$apply();
                });
            } else if (dirty) {
                $rootScope.$apply();
            }
            return tabInfo;
        };
        trackRequestTimeout = function(id, pageUrl, requestUrl) {
            return setTimeout(function() {
                var domain, tabInfo;
                tabInfo = tabsMap[id];
                if (!tabInfo || tabInfo.url !== pageUrl) {
                    return;
                }
                domain = domainUtils.parseUri(requestUrl).host;
                return setTabInfo(id, null, domain, "timeout");
            }, REQUEST_TIMEOUT);
        };
        onBeforeRequest = function(details) {
            var host, tabInfo, _ref;
            if (details.tabId < 0 || details.type === "other") {
                return;
            }
            host = domainUtils.parseUri(details.url).host;
            if (details.type === "main_frame") {
                delete tabsMap[details.tabId];
                tabInfo = setTabInfo(details.tabId, details.url, host, "pending");
                if (((_ref = $rootScope.currentTab) != null ? _ref.id :void 0) === tabInfo.id) {
                    $rootScope.currentTab = tabInfo;
                    $rootScope.$apply();
                }
            } else {
                tabInfo = setTabInfo(details.tabId, null, host, "pending");
            }
            return trackRequestTimeout(tabInfo.id, tabInfo.url, details.url);
        };
        onRequestErrorOccurred = function(details) {
            var domainStatus, _ref;
            if (details.tabId < 0 || details.type === "other") {
                return;
            }
            domainStatus = "blocked";
            if ((_ref = details.error) === "net::ERR_BLOCKED_BY_CLIENT" || _ref === "net::ERR_ABORTED") {
                domainStatus = "error";
            }
            return setTabInfo(details.tabId, null, domainUtils.parseUri(details.url).host, domainStatus);
        };
        onHeadersReceived = function(details) {
            if (details.tabId < 0 || details.type === "other") {
                return;
            }
            return setTabInfo(details.tabId, null, domainUtils.parseUri(details.url).host, "success");
        };
        onTabRemoved = function(tabId) {
            delete tabsMap[tabId];
            return $rootScope.$apply();
        };
        onTabActivated = function(activeInfo) {
            var tabInfo;
            tabInfo = setTabInfo(activeInfo.tabId);
            return $rootScope.$apply(function() {
                return $rootScope.currentTab = tabInfo;
            });
        };
        onWindowFocusChanged = function(winId) {
            return chrome.tabs.query({
                active:true,
                windowId:winId,
                currentWindow:true
            }, function(_this) {
                return function(tabs) {
                    var tabInfo;
                    tabInfo = setTabInfo(tabs[0].id, tabs[0].url);
                    return $rootScope.$apply(function() {
                        return $rootScope.currentTab = tabInfo;
                    });
                };
            }(this));
        };
        onDomainsChanged = function(domains) {
            var domain, domainTree, ret, status, subTree, topDomain;
            domainTree = {};
            for (domain in domains) {
                status = domains[domain];
                topDomain = domainUtils.topDomain(domain);
                if (domainTree[topDomain] == null) {
                    domainTree[topDomain] = {};
                }
                domainTree[topDomain][domain] = status;
            }
            ret = [];
            for (topDomain in domainTree) {
                subTree = domainTree[topDomain];
                if (_.every(_.values(subTree), function(value) {
                    return value === "blocked";
                }) && !domainManager.coversDomain(topDomain)) {
                    ret.push(topDomain);
                } else {
                    for (domain in subTree) {
                        status = subTree[domain];
                        if (status === "blocked" && !domainManager.coversDomain(domain)) {
                            ret.push(domain);
                        }
                    }
                }
            }
            return $rootScope.blockedDomains = ret;
        };
        this.init = _.once(function() {
            teleScope.link("currentTab");
            teleScope.link("blockedDomains");
            chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {
                urls:[ "<all_urls>" ]
            });
            chrome.webRequest.onErrorOccurred.addListener(onRequestErrorOccurred, {
                urls:[ "<all_urls>" ]
            });
            chrome.webRequest.onCompleted.addListener(onHeadersReceived, {
                urls:[ "<all_urls>" ]
            });
            chrome.tabs.onRemoved.addListener(onTabRemoved);
            chrome.tabs.onActivated.addListener(onTabActivated);
            chrome.windows.onFocusChanged.addListener(onWindowFocusChanged);
            chrome.tabs.query({
                active:true,
                currentWindow:true
            }, function(tabs) {
                var tabInfo;
                tabInfo = setTabInfo(tabs[0].id, tabs[0].url);
                return $rootScope.$apply(function() {
                    return $rootScope.currentTab = tabInfo;
                });
            });
            return $rootScope.$watch("currentTab.domains", onDomainsChanged, true);
        });
        return this;
    };
    libs = [ "../app", "underscore", "./storage", "./teleScope", "./domainUtils", "./domainManager" ];
    define(libs, function(app) {
        return app.service("tabsTracker", tabsTracker);
    });
}).call(this);