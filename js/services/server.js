(function() {
    define([ "../app", "./RedSockClient", "./storage", "./track" ], function(app) {
        var server;
        server = function($rootScope, $log, storage, RedSockClient, track, API_URL, VER) {
            var client, me;
            me = "[server]";
            console.log(me);
            client = RedSockClient.create(API_URL);
            client.on("reconnecting", function(_this) {
                return function(retrial) {
                    if (retrial === 10) {
                        return track.event("extension", "reconnect-10", "" + VER);
                    }
                };
            }(this));
            this.emit = function(_this) {
                console.log('emit');
                return function(event, data, callback) {
                    return client.emit(event, data, function(resp) {
                        return $rootScope.$apply(function() {
                            return typeof callback === "function" ? callback(resp) :void 0;
                        });
                    });
                };
            }(this);
            this.on = function(_this) {
                return function(event, callback) {
                    return client.on(event, function(data) {
                        return $rootScope.$apply(function() {
                            return typeof callback === "function" ? callback(data) :void 0;
                        });
                    });
                };
            }(this);
            this.init = function() {
                client.connect();
                return $log.log(me, "begin to connect " + API_URL);
            };
            return this;
        };
        return app.service("server", server);
    });
}).call(this);