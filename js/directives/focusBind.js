(function() {
    var focusBind;
    focusBind = function() {
        return {
            restrict:"A",
            scope:{
                focusTrigger:"=focusBind"
            },
            link:function(scope, element) {
                return scope.$watch("focusTrigger", function(val) {
                    if (val === true) {
                        element[0].focus();
                        element[0].select();
                        return scope.focusTrigger = false;
                    }
                });
            }
        };
    };
    define([ "../app" ], function(app) {
        return app.directive("focusBind", focusBind);
    });
}).call(this);