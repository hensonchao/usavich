(function() {
    var storage;
    storage = function() {
        this.set = function(_this) {
            return function(key, val) {
                localStorage[key] = JSON.stringify(angular.copy(val));
                return val;
            };
        }(this);
        this.get = function(_this) {
            return function(key, defaultValue) {
                if (defaultValue == null) {
                    defaultValue = void 0;
                }
                if (localStorage[key] !== void 0) {
                    return JSON.parse(localStorage[key]);
                } else {
                    return defaultValue;
                }
            };
        }(this);
        this["default"] = function(_this) {
            return function(key, defaultValue) {
                if (localStorage[key] == null) {
                    localStorage[key] = defaultValue;
                }
                return localStorage[key];
            };
        }(this);
        this.remove = function(_this) {
            return function(key) {
                return localStorage.removeItem(key);
            };
        }(this);
        return this;
    };
    define([ "../app" ], function(app) {
        return app.service("storage", storage);
    });
}).call(this);