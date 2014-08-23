(function() {
    var teleMethod;
    teleMethod = function($log, $rootScope, $q, generate) {
        var channel, isBackground, me, methodMap, uid;
        uid = generate.randomId(4);
        me = "[teleMethod @" + location.pathname + " #" + uid + "]";
        channel = "[teleMethod]";
        methodMap = {};
        isBackground = function(_this) {
            return function() {
                return window === chrome.extension.getBackgroundPage();
            };
        }(this);
        this.registerService = function(serviceName, service, methods) {
            var f, method, methodId, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = methods.length; _i < _len; _i++) {
                method = methods[_i];
                methodId = "" + serviceName + ":" + method;
                if (methodMap[methodId]) {
                    continue;
                }
                if (isBackground()) {
                    _results.push(methodMap[methodId] = {
                        service:service,
                        method:service[method]
                    });
                } else {
                    f = function(methodId) {
                        return function() {
                            var defered;
                            defered = $q.defer();
                            chrome.runtime.sendMessage({
                                channel:channel,
                                from:me,
                                type:"command",
                                methodId:methodId,
                                args:Array.prototype.slice.call(arguments, 0)
                            }, function(response) {
                                return defered.resolve(response);
                            });
                            return defered.promise;
                        };
                    };
                    _results.push(service[method] = f(methodId));
                }
            }
            return _results;
        };
        if (isBackground()) {
            chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
                if (message.type === "command") {
                    return $rootScope.$apply(function() {
                        var methodInfo, ret;
                        $log.info("get command from " + message.from + ", ", message.methodId, message.args);
                        methodInfo = methodMap[message.methodId];
                        ret = methodInfo != null ? methodInfo.method.apply(methodInfo.service, message.args) :void 0;
                        return sendResponse(ret);
                    });
                }
            });
        }
        return this;
    };
    define([ "../app", "./generate" ], function(app) {
        return app.service("teleMethod", teleMethod);
    });
}).call(this);