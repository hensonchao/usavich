(function() {
    var safeApply;
    safeApply = function() {
        this.apply = function(scope, fn) {
            var _ref;
            if ((_ref = scope.$root.$$phase) === "$apply" || _ref === "$digest") {
                if (fn) {
                    return scope.$eval(fn);
                }
            } else {
                if (fn) {
                    return scope.$apply(fn);
                } else {
                    return scope.$apply();
                }
            }
        };
        return this;
    };
    define([ "../app" ], function(app) {
        return app.service("safeApply", safeApply);
    });
}).call(this);