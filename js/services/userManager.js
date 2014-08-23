(function() {
    var libs, userManager;
    userManager = function($rootScope, $log, teleScope, teleMethod, server, storage, domainManager, ROLES, VER) {
        var bindEvents, emptyProfile, emptyUser, me, save;
        me = "[userManager]";
        console.log(me);
        emptyProfile = {
            sid:"",
            name:"",
            until:null,
            level:"",
            no_password:false,
            anonymous:false
        };
        emptyUser = {
            profile:emptyProfile,
            role:ROLES.GUEST
        };
        this.load = function(data) {
            $rootScope.user.profile.sid = data.sid;
            $rootScope.user.profile.name = data.name;
            $rootScope.user.profile.anonymous = data.anonymous;
            $rootScope.user.profile.no_password = data.no_password || false;
            $rootScope.user.profile.until = data.until || data.vUntil;
            $rootScope.user.profile.level = data.level || data.vLevel;
            if (data.level) {
                $rootScope.user.role = ROLES.VIP;
            } else if (data.name) {
                $rootScope.user.role = ROLES.USER;
            } else {
                $rootScope.user.role = ROLES.GUEST;
            }
            return $log.info("" + me + "user load from :", data);
        };
        this.checkin = function(_this) {
            return function() {
                var data;
                data = {
                    ver:VER,
                    sid:$rootScope.user.profile.sid,
                    proxies:$rootScope.proxies
                };
                return server.emit("checkin", data, function() {
                    return $log.log("checkin successful");
                });
            };
        }(this);
        this.updateProfile = function() {
            return server.emit("update_profile", null, function() {
                return $log.log("update profile successful");
            });
        };
        save = function() {
            var data;
            data = angular.copy($rootScope.user.profile);
            return storage.set("profile", data);
        };
        this.clear = function() {
            $rootScope.user.profile = angular.copy(emptyProfile);
            return domainManager.clear();
        };
        this.logout = function(_this) {
            return function() {
                _this.clear();
                return _this.checkin();
            };
        }(this);
        bindEvents = function(_this) {
            return function() {
                $rootScope.$watch("user", function() {
                    return save();
                }, true);
                $log.log(me, "ccccc");
                server.on("connect", function() {
                    return _this.checkin();
                });
                server.on("reconnect", function() {
                    return _this.checkin();
                });
                return server.on("profile", function(data) {
                    _this.load(data);
                    if (data.name) {
                        storage.set("lastLoginName", data.name);
                    }
                    return true;
                });
            };
        }(this);
        this.init = function(_this) {
            return function() {
                $rootScope.user = angular.copy(emptyUser);
                if (storage.get("user")) {
                    _this.load(storage.get("user"));
                    save();
                    storage.remove("user");
                } else if (storage.get("profile")) {
                    _this.load(storage.get("profile"));
                }
                bindEvents();
                teleScope.link("user");
                return $log.info("userManager Ready!");
            };
        }(this);
        teleMethod.registerService("userManager", this, [ "logout", "checkin", "load", "clear", "updateProfile" ]);
        return this;
    };
    libs = [ "../app", "./server", "./teleScope", "./teleMethod", "./domainManager", "./storage" ];
    define(libs, function(app) {
        return app.service("userManager", userManager);
    });
}).call(this);