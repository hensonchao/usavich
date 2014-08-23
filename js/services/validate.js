(function() {
    var validate;
    validate = function() {
        this.ip = function(str) {
            var part, parts;
            if (!str) {
                return false;
            }
            parts = str.split(".");
            return parts.length === 4 && _.every(function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = parts.length; _i < _len; _i++) {
                    part = parts[_i];
                    _results.push(isNaN(part));
                }
                return _results;
            }());
        };
        this.email = function(str) {
            return str && str.length >= 6 && /^[\w\-\.]+@[\w\-]+(\.\w+)+$/.test(str);
        };
        this.phone = function(str) {
            return str && str.length === 11 && /^1(\d)+$/.test(str);
        };
        this.domain = function(str) {
            var d, _ref;
            if (!str) {
                return false;
            }
            d = str.trim();
            return d && 0 < (_ref = d.indexOf(".")) && _ref < d.length - 1;
        };
        return this;
    };
    define([ "../app", "underscore" ], function(app, _) {
        return app.service("validate", validate);
    });
}).call(this);