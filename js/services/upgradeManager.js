(function() {
    var upgradeManager;
    upgradeManager = function($rootScope, $log, server, teleScope) {
        $rootScope.needUpgrade = false;
        this.init = function() {
            teleScope.link("needUpgrade");
            return server.on("ver_expire", function(min_ver) {
                return $rootScope.needUpgrade = true;
            });
        };
        return this;
    };
    define([ "../app", "./server", "./teleScope" ], function(app) {
        return app.service("upgradeManager", upgradeManager);
    });
}).call(this);