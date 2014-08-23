(function() {
    var pageManager;
    pageManager = function($window) {
        this.reloadCurrentTabAndClosePopup = function() {
            return chrome.tabs.query({
                active:true,
                currentWindow:true
            }, function(_this) {
                return function(tabs) {
                    var tab, _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = tabs.length; _i < _len; _i++) {
                        tab = tabs[_i];
                        _results.push(chrome.tabs.reload(tab.id, {}, function() {
                            return $window.close();
                        }));
                    }
                    return _results;
                };
            }(this));
        };
        this.openOptions = function(_this) {
            return function(tail, callback) {
                var fullUrl, url;
                if (tail == null) {
                    tail = "";
                }
                url = "options.html";
                fullUrl = chrome.runtime.getURL(url);
                return chrome.tabs.getAllInWindow(null, function(tabs) {
                    var tab, _i, _len;
                    for (_i = 0, _len = tabs.length; _i < _len; _i++) {
                        tab = tabs[_i];
                        if (tab.url.indexOf(fullUrl) === 0) {
                            chrome.tabs.update(tab.id, {
                                url:fullUrl + tail,
                                highlighted:true
                            }, function() {
                                return typeof callback === "function" ? callback() :void 0;
                            });
                            return;
                        }
                    }
                    return chrome.tabs.getSelected(null, function(tab) {
                        chrome.tabs.create({
                            url:url + tail,
                            index:tab.index + 1
                        });
                        return typeof callback === "function" ? callback() :void 0;
                    });
                });
            };
        }(this);
        this.openLogin = function(_this) {
            return function(source, callback) {
                var fullUrl, tail, url;
                if (source == null) {
                    source = "";
                }
                url = "login.html";
                fullUrl = chrome.runtime.getURL(url);
                tail = source ? "#?source=" + source :"";
                return chrome.tabs.getAllInWindow(null, function(tabs) {
                    var tab, _i, _len;
                    for (_i = 0, _len = tabs.length; _i < _len; _i++) {
                        tab = tabs[_i];
                        if (tab.url.indexOf(fullUrl) === 0) {
                            chrome.tabs.update(tab.id, {
                                url:fullUrl + tail,
                                highlighted:true
                            }, function() {
                                return typeof callback === "function" ? callback() :void 0;
                            });
                            return;
                        }
                    }
                    return chrome.tabs.getSelected(null, function(tab) {
                        chrome.tabs.create({
                            url:url + tail,
                            index:tab.index + 1
                        });
                        return typeof callback === "function" ? callback() :void 0;
                    });
                });
            };
        }(this);
        this.gotoOptions = function(_this) {
            return function(tail) {
                var fullUrl, url;
                if (tail == null) {
                    tail = "";
                }
                url = "options.html";
                fullUrl = chrome.runtime.getURL(url) + tail;
                return location.href = fullUrl;
            };
        }(this);
        this.gotoLogin = function(source) {
            var fullUrl, url;
            if (source == null) {
                source = "";
            }
            url = "login.html";
            fullUrl = chrome.runtime.getURL(url);
            if (source) {
                fullUrl += "#?source=" + source;
            }
            return location.href = fullUrl;
        };
        this.gotoUpgrade = function(tail) {
            var fullUrl, url;
            if (tail == null) {
                tail = "";
            }
            url = "upgrade.html";
            fullUrl = chrome.runtime.getURL(url) + tail;
            return location.href = fullUrl;
        };
        this.openUrl = function(_this) {
            return function(url, callback) {
                return chrome.tabs.getSelected(null, function(tab) {
                    chrome.tabs.create({
                        url:url,
                        index:tab.index + 1
                    });
                    return typeof callback === "function" ? callback() :void 0;
                });
            };
        }(this);
        return this;
    };
    define([ "../app" ], function(app) {
        return app.service("pageManager", pageManager);
    });
}).call(this);