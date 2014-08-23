/**
 * ÓòÃû¹ÜÀí
 */
(function() {
    var domainManager, libs;
    domainManager = function($rootScope, $log, $timeout, teleScope, teleMethod, storage, server, domainUtils, timeUtils, ROLES, GUEST_DOMAINS, DEFAULT_DOMAINS) {
        var bindEvents, find, loadDomainsFromServer, me, pullDomains, pushDomains, save, syncDomains, syncDomainsForever, syncTimeout, updateModel;
        me = "[domainManager]";
        this.load = function() {
            var domains;
            domains = storage.get("domains", []);
            if (domains.length > 0) {
                return $rootScope.domains = domains;
            }
        };
        save = function() {
            return storage.set("domains", $rootScope.domains);
        };
        this.clear = function() {
            return $rootScope.domains = [];
        };
        find = function(options) {
            return _.findWhere($rootScope.domains, options);
        };
        this.coversDomain = function(_this) {
            return function(domain) {
                var domainList, name;
                domainList = _this.domainNames();
                return _.any(function() {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = domainList.length; _i < _len; _i++) {
                        name = domainList[_i];
                        _results.push(domainUtils.dnsDomainIs(domain, name));
                    }
                    return _results;
                }());
            };
        }(this);
        this.initFromDefault = function() {
            var name, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = DEFAULT_DOMAINS.length; _i < _len; _i++) {
                name = DEFAULT_DOMAINS[_i];
                _results.push($rootScope.domains.push({
                    name:name,
                    _dirty:true,
                    _deleted:false,
                    _mtime:0,
                    _init:true
                }));
            }
            return _results;
        };
        this.del = function(name) {
            var domain;
            domain = find({
                name:name
            });
            if (domain) {
                domain._dirty = true;
                return domain._deleted = true;
            }
        };
        this.add = function(name) {
            var domain;
            domain = find({
                name:name
            });
            if (!domain) {
                return $rootScope.domains.push({
                    name:name,
                    _dirty:true,
                    _deleted:false,
                    _mtime:0
                });
            } else {
                if (domain._deleted) {
                    domain._dirty = true;
                    return domain._deleted = false;
                }
            }
        };
        this.update = function(oldDomain, newDomain) {
            var domain;
            domain = find({
                name:oldDomain
            });
            if (domain && oldDomain !== newDomain) {
                domain.name = newDomain;
                return domain._dirty = true;
            }
        };
        updateModel = function(o, n) {
            var k, _i, _len, _ref, _results;
            _ref = [ "name", "_dirty", "_deleted", "_mtime", "_init" ];
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                k = _ref[_i];
                _results.push(o[k] = n[k]);
            }
            return _results;
        };
        this.domainNames = function() {
            if ($rootScope.user.role === ROLES.VIP) {
                return _.pluck(_.where($rootScope.domains, {
                    _deleted:false
                }), "name");
            } else {
                return GUEST_DOMAINS;
            }
        };
        loadDomainsFromServer = function(domainList) {
            var d, m, _i, _len, _results;
            if ((domainList != null ? domainList.length :void 0) > 0) {
                _results = [];
                for (_i = 0, _len = domainList.length; _i < _len; _i++) {
                    d = domainList[_i];
                    m = find({
                        _id:d._id
                    });
                    if (m) {
                        _results.push(updateModel(m, d));
                    } else {
                        _results.push($rootScope.domains.push(d));
                    }
                }
                return _results;
            }
        };
        $rootScope.isSyncing = false;
        syncTimeout = null;
        syncDomains = function() {
            if ($rootScope.user.role === ROLES.GUEST) {
                return;
            }
            $log.info(me, "enter syncDomains");
            if (syncTimeout) {
                clearTimeout(syncTimeout);
                syncTimeout = null;
            }
            if ($rootScope.isSyncing) {
                return syncTimeout = setTimeout(syncDomains, 1e3);
            } else {
                $rootScope.isSyncing = true;
                return pullDomains(function() {
                    return pushDomains(function() {
                        return setTimeout(function() {
                            return $rootScope.isSyncing = false;
                        }, 5 * 1e3);
                    });
                });
            }
        };
        pullDomains = function(_this) {
            return function(callback) {
                var m, max_mtime;
                max_mtime = _.max(_.union([ 0 ], function() {
                    var _i, _len, _ref, _results;
                    _ref = $rootScope.domains;
                    _results = [];
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        m = _ref[_i];
                        _results.push(m._mtime);
                    }
                    return _results;
                }()));
                $log.debug(me, "sync domains, max_mtime=", max_mtime);
                return server.emit("sync_domains", {
                    mtime:max_mtime
                }, function(resp) {
                    var _ref;
                    if (((_ref = resp.update) != null ? _ref.length :void 0) > 0) {
                        loadDomainsFromServer(resp.update);
                    } else if ($rootScope.domains.length === 0 && $rootScope.user.role === ROLES.VIP) {
                        _this.initFromDefault();
                    }
                    return callback();
                });
            };
        }(this);
        pushDomains = function(callback) {
            var data;
            if ($rootScope.user.role !== ROLES.VIP) {
                return callback();
            }
            data = {
                domains:_.where($rootScope.domains, {
                    _dirty:true
                })
            };
            if (!data.domains.length) {
                return callback();
            }
            $log.debug(me, "upload Dirty domains length=" + data.domains.length);
            return server.emit("dirty_domains", data, function(resp) {
                if (resp.replace) {
                    $rootScope.domains = _.reject($rootScope.domains, function(m) {
                        return m._dirty;
                    });
                    loadDomainsFromServer(resp.replace);
                }
                return callback();
            });
        };
        syncDomainsForever = _.once(function(_this) {
            return function() {
                var f;
                f = function() {
                    if ($rootScope.user.role === ROLES.VIP) {
                        return syncDomains();
                    }
                };
                setInterval(f, 60 * 1e3);
                return f();
            };
        }(this));
        bindEvents = function(_this) {
            return function() {
                $rootScope.$watch("domains", function(n, o) {
                    if (!_.isEqual(n, o)) {
                        syncDomains();
                        return save();
                    }
                }, true);
                server.on("force_sync_domains", function() {
                    return syncDomains();
                });
                server.on("profile", function() {
                    return syncDomainsForever();
                });
                $rootScope.$watch("user.profile", function(n, o) {
                    if (!_.isEqual(n, o)) {
                        return $timeout(syncDomains);
                    }
                }, true);
                syncTimeout = 0;
                return $rootScope.$watch("isSyncing", function(n, o) {
                    if (n !== o) {
                        if (n) {
                            return syncTimeout = $timeout(function() {
                                $rootScope.isSyncing = false;
                                return syncTimeout = 0;
                            }, 10 * 1e3);
                        } else {
                            if (syncTimeout) {
                                $timeout.cancel(syncTimeout);
                                return syncTimeout = 0;
                            }
                        }
                    }
                }, true);
            };
        }(this);
        this.init = function(_this) {
            return function() {
                $rootScope.domains = [];
                _this.load();
                bindEvents();
                teleScope.linkList("domains");
                return $log.info(me, "domainManager Ready!");
            };
        }(this);
        teleMethod.registerService("domainManager", this, [ "clear" ]);
        return this;
    };
    libs = [ "../app", "underscore", "./teleScope", "./teleMethod", "./server", "./storage", "./domainUtils", "./timeUtils" ];
    define(libs, function(_this) {
        return function(app) {
            return app.service("domainManager", domainManager);
        };
    }(this));
}).call(this);