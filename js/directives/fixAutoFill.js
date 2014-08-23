(function() {
    var fixAutoFill;
    fixAutoFill = function($interval) {
        return {
            restrict:"A",
            require:"ngModel",
            link:function(scope, element, attrs, ngModel) {
                var prev_val;
                prev_val = "";
                return $interval(function() {
                    var val;
                    val = element.val();
                    if (prev_val !== val) {
                        ngModel.$setViewValue(val);
                        return prev_val = val;
                    }
                }, 300);
            }
        };
    };
    define([ "../app" ], function(app) {
        return app.directive("fixAutoFill", fixAutoFill);
    });
}).call(this);