(function() {
    var resizeIframe;
    resizeIframe = function($window) {
        return {
            restrict:"E",
            scope:{
                src:"="
            },
            templateUrl:"resizeIframe.html",
            link:function(scope, element) {
                var ifr, onResize, topDiv;
                ifr = element.find("iframe");
                ifr[0].src = scope.src;
                topDiv = element.parent().parent();
                onResize = function() {
                    return ifr[0].height = topDiv[0].offsetHeight - 20;
                };
                angular.element($window).bind("resize", onResize);
                return onResize();
            }
        };
    };
    define([ "../app" ], function(app) {
        app.run(function($templateCache) {
            return $templateCache.put("resizeIframe.html", '<div height="100%" style="margin-top:10px"><iframe width="100%" height="500" frameborder="0" src=""></iframe></div>');
        });
        return app.directive("resizeIframe", resizeIframe);
    });
}).call(this);