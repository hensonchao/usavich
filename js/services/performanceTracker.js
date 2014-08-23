(function() {
    var libs, performanceTracker;
    performanceTracker = function($rootScope, $log, $timeout, $interval, $http, proxyManager, storage, timeUtils, domainUtils, ROLES, LOG_URL, VER) {
        var applyTestResult, emptyPerfResult, me, onCompleted, onErrorOccurred, onHeadersReceived, onProxyError, onSendHeaders, perfResults, reportPerf, testProxiesForever, testProxy, tests;
        me = "[performanceTracker]";
        perfResults = {};
        emptyPerfResult = {
            id:"",
            url:"",
            proxy:"",
            timeSendHeaders:-1,
            timeHeadersReceived:-1,
            timeEnded:-1,
            contentLength:0,
            error:"",
            type:"latency"
        };
        reportPerf = function(proxy, perf) {
            var data, key, val, _results;
            _results = [];
            for (key in perf) {
                val = perf[key];
                data = {
                    event:"proxy." + key,
                    data:{
                        sid:$rootScope.user.profile.sid,
                        proxy:proxy
                    }
                };
                data.data[key] = val;
                _results.push($http({
                    method:"POST",
                    url:LOG_URL,
                    data:data
                }));
            }
            return _results;
        };
        applyTestResult = function(result) {
            var latency, proxy, speed;
            if (result.type === "speed") {
                speed = result.contentLength / 1e3 / (result.timeEnded - result.timeHeadersReceived);
                if (!result.error) {
                    reportPerf(result.proxy, {
                        speed:parseInt(speed)
                    });
                }
                proxy = proxyManager.getProxyByName(result.proxy);
                if (proxy) {
                    if (result.error) {
                        proxyManager.setSpeed(proxy, 3);
                    } else {
                        proxyManager.setSpeed(proxy, speed);
                    }
                }
            } else {
                latency = 1e3 * (result.timeHeadersReceived - result.timeSendHeaders);
                if (!result.error) {
                    reportPerf(result.proxy, {
                        latency:latency
                    });
                }
                proxy = proxyManager.getProxyByName(result.proxy);
                if (proxy) {
                    if (result.error) {
                        proxy.fail = Math.max(1, proxy.fail + 1);
                        proxy.stability = proxyManager.setStability(proxy, 0);
                    } else {
                        proxy.fail = Math.min(-1, proxy.fail - 1);
                        proxy.latency = proxyManager.setLatency(proxy, latency);
                        proxy.stability = proxyManager.setStability(proxy, 1);
                    }
                }
            }
            return delete perfResults[result.id];
        };
        onSendHeaders = function(details) {
            var isProxySpeedTest, isProxyTest, result, uri;
            isProxyTest = details.url.indexOf("_HXPROXY_NAME=") > 0;
            if (!isProxyTest) {
                return;
            }
            isProxySpeedTest = isProxyTest && details.url.indexOf("_HXPROXY=") === -1;
            uri = domainUtils.parseUri(details.url);
            result = angular.copy(emptyPerfResult);
            result.id = details.requestId;
            result.url = details.url;
            result.proxy = uri.query._HXPROXY_NAME;
            result.timeSendHeaders = parseInt(details.timeStamp) / 1e3;
            result.type = isProxySpeedTest ? "speed" :"latency";
            return perfResults[details.requestId] = result;
        };
        onHeadersReceived = function(details) {
            var contentLength, header, result, _i, _len, _ref;
            result = perfResults[details.requestId];
            if (result) {
                contentLength = 0;
                _ref = details.responseHeaders;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    header = _ref[_i];
                    if (header.name.toLowerCase() === "content-length") {
                        contentLength = parseInt(header.value);
                        break;
                    }
                }
                result.timeHeadersReceived = parseInt(details.timeStamp) / 1e3;
                return result.contentLength = contentLength;
            }
        };
        onErrorOccurred = function(details) {
            var result;
            result = perfResults[details.requestId];
            if (result) {
                result.timeEnded = parseInt(details.timeStamp) / 1e3;
                result.error = details.error;
                return applyTestResult(result);
            }
        };
        onCompleted = function(details) {
            var result;
            result = perfResults[details.requestId];
            if (result) {
                result.timeEnded = parseInt(details.timeStamp) / 1e3;
                return applyTestResult(result);
            }
        };
        onProxyError = function(details) {
            var proxy, _ref;
            if ((_ref = details.error) === "net::ERR_PROXY_CONNECTION_FAILED" || _ref === "net::ERR_TUNNEL_CONNECTION_FAILED") {
                return;
            }
            proxy = $rootScope.proxies[0];
            return chrome.proxy.settings.get({}, function(settings) {
                return chrome.management.getAll(function(exts) {
                    var ext, extensions, script, _i, _len, _ref1, _ref2;
                    extensions = [];
                    for (_i = 0, _len = exts.length; _i < _len; _i++) {
                        ext = exts[_i];
                        if (ext.enabled && ext.id !== chrome.runtime.id && ext.type === "extension") {
                            extensions.push(ext.name);
                        }
                    }
                    script = (_ref1 = settings.value) != null ? (_ref2 = _ref1.pacScript) != null ? _ref2.data.slice(-1e3) :void 0 :void 0;
                    return Raven.captureMessage("" + details.error, {
                        extra:{
                            details:details.details,
                            level:settings.levelOfControl,
                            extensions:extensions,
                            script:script
                        },
                        tags:{
                            fatal:details.fatal,
                            ver:VER,
                            proxy:proxy != null ? proxy.name :void 0
                        }
                    });
                });
            });
        };
        tests = {
            speed:{
                queue:[],
                doing:false
            },
            latency:{
                queue:[],
                doing:false
            }
        };
        testProxy = function(proxy, metric) {
            var afterTest, options, test;
            test = tests[metric];
            if (test.doing) {
                return;
            }
            test.doing = true;
            afterTest = function() {
                test.doing = false;
                return proxy["" + metric + "TestTime"] = timeUtils.time();
            };
            options = {
                method:"GET"
            };
            if (metric === "latency") {
                options.url = "https://" + proxy.host + ":" + proxy.port + "/info?_=" + Math.random() + "&_HXPROXY_NAME=" + proxy.name + "&_HXPROXY=DIRECT";
                options.timeout = 5 * 1e3;
            } else if (metric === "speed") {
                options.url = "https://" + proxy.host + ":" + proxy.port + "/bit_test?size=500000&_HXPROXY_NAME=" + proxy.name + "&_=" + Math.random();
                options.timeout = 60 * 1e3;
            } else {
                return;
            }
            return $http(options).success(afterTest).error(afterTest);
        };
        testProxiesForever = _.once(function(_this) {
            return function() {
                var f;
                f = function() {
                    var fail, proxy, sameResults, speedTestWait, testWait, _i, _j, _len, _len1, _ref, _ref1, _results;
                    _ref = $rootScope.proxies;
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        proxy = _ref[_i];
                        fail = proxy.fail;
                        sameResults = Math.abs(fail);
                        testWait = Math.min(300, 10 + 300 * Math.pow(sameResults / 5, 2));
                        if (proxy.latencyTestTime + testWait < timeUtils.time()) {
                            testProxy(proxy, "latency");
                            break;
                        }
                    }
                    speedTestWait = $rootScope.user.role === ROLES.VIP ? 15 * 60 :60 * 60;
                    _ref1 = $rootScope.proxies;
                    _results = [];
                    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                        proxy = _ref1[_j];
                        if (proxy.speedTestTime + speedTestWait < timeUtils.time()) {
                            testProxy(proxy, "speed");
                            break;
                        } else {
                            _results.push(void 0);
                        }
                    }
                    return _results;
                };
                return setTimeout(function() {
                    return setInterval(f, 1e3);
                }, 5e3);
            };
        }(this));
        this.init = function() {
            chrome.webRequest.onSendHeaders.addListener(onSendHeaders, {
                urls:[ "<all_urls>" ]
            });
            chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, {
                urls:[ "<all_urls>" ]
            }, [ "responseHeaders" ]);
            chrome.webRequest.onCompleted.addListener(onCompleted, {
                urls:[ "<all_urls>" ]
            });
            chrome.webRequest.onErrorOccurred.addListener(onErrorOccurred, {
                urls:[ "<all_urls>" ]
            });
            chrome.proxy.onProxyError.addListener(onProxyError);
            testProxiesForever();
            return $log.log(me, "performanceTracker Ready!");
        };
        return this;
    };
    libs = [ "../app", "underscore", "./storage", "./proxyManager", "./timeUtils" ];
    define(libs, function(app) {
        return app.service("performanceTracker", performanceTracker);
    });
}).call(this);