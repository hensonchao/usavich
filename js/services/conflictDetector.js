/**
 * chrome À©Õ¹³åÍ»¼ì²é
 */
(function() {
    var libs, __indexOf = [].indexOf || function(item) {
        for (var i = 0, l = this.length; i < l; i++) {
            if (i in this && this[i] === item) return i;
        }
        return -1;
    };
    libs = [ "angular", "underscore", "../app", "./teleScope" ];
    define(libs, function(angular, _, app) {
        var conflictDetector;
        conflictDetector = function($rootScope, $log, teleScope, $interval) {
            this.init = _.once(function() {
                var f;
                $rootScope.conflicts = [];
                teleScope.link("conflicts");
                f = function() {
                    return chrome.proxy.settings.get({}, function(data) {
                        if (data.levelOfControl === "controlled_by_other_extensions") {
                            return chrome.management.getAll(function(exts) {
                                var ext, _conflicts, _i, _len;
                                _conflicts = [];
                                for (_i = 0, _len = exts.length; _i < _len; _i++) {
                                    ext = exts[_i];
                                    if (ext.enabled && __indexOf.call(ext.permissions, "proxy") >= 0 && ext.id !== chrome.runtime.id) {
                                        _conflicts.push({
                                            id:ext.id,
                                            name:ext.name,
                                            iconUrl:ext.icons[0].url
                                        });
                                    }
                                }
                                _.sortBy(_conflicts, function(item) {
                                    return item.id;
                                });
                                return $rootScope.$apply(function() {
                                    return $rootScope.conflicts = _conflicts;
                                });
                            });
                        } else {
                            return $rootScope.$apply(function() {
                                return $rootScope.conflicts = [];
                            });
                        }
                    });
                };
                $interval(f, 1e3);
                return $log.info("conflictDetctor Ready!");
            });
            return this;
        };
        return app.service("conflictDetector", conflictDetector);
    });
}).call(this);