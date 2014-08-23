(function() {
    var teleScope;
    teleScope = function($q, $log, $rootScope, generate, timeUtils) {
        var channel, linkedKeys, listDiff, me, mergeList, onAskMessage, onChangeMessage, uid, unwatch, watch, _link;
        channel = "[teleScope]";
        uid = generate.randomId(4);
        me = "[TeleScope @" + location.pathname + " #" + uid + "]";
        $log.debug(me, "created");
        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            if (message.channel === channel && message.from !== me && linkedKeys[message.key]) {
                $log.info("get message", message, message.value);
                if (message.type === "change") {
                    return onChangeMessage(message);
                } else if (message.type === "ask") {
                    return onAskMessage(message, sendResponse);
                }
            }
        });
        onChangeMessage = function(message) {
            var type;
            $log.debug(me, "<~", message.from, "" + message.key);
            unwatch(message.key);
            if (message.delta) {
                type = "list";
                mergeList($rootScope[message.key], message.delta);
            } else {
                type = "object";
                $rootScope[message.key] = message.value;
            }
            watch(message.key, type);
            return $rootScope.$apply();
        };
        mergeList = function(list, delta) {
            var i, item, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2, _results;
            _ref = delta.old;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                item = _ref[_i];
                for (i = _j = _ref1 = list.length - 1; _ref1 <= 0 ? _j <= 0 :_j >= 0; i = _ref1 <= 0 ? ++_j :--_j) {
                    if (angular.equals(list[i], item)) {
                        list.splice(i, 1);
                    }
                }
            }
            _ref2 = delta["new"];
            _results = [];
            for (_k = 0, _len1 = _ref2.length; _k < _len1; _k++) {
                item = _ref2[_k];
                _results.push(list.push(item));
            }
            return _results;
        };
        onAskMessage = function(message, sendResponse) {
            var value;
            $log.debug(me, "<~ ", message.from, "? " + message.key);
            if ($rootScope[message.key] !== void 0) {
                value = angular.copy($rootScope[message.key]);
                $log.debug(me, "=> ", message.from, "" + message.key);
                return sendResponse({
                    channel:channel,
                    from:me,
                    type:"answer",
                    key:message.key,
                    value:value
                });
            }
        };
        watch = function(_this) {
            return function(key, type) {
                var _ref;
                if (type == null) {
                    type = "object";
                }
                if (typeof linkedKeys !== "undefined" && linkedKeys !== null ? (_ref = linkedKeys[key]) != null ? _ref.unwatch :void 0 :void 0) {
                    return;
                }
                return linkedKeys[key].unwatch = $rootScope.$watch(key, function(newValue, oldValue) {
                    var message, value;
                    if (!angular.equals(oldValue, newValue)) {
                        message = {
                            channel:channel,
                            from:me,
                            key:key,
                            type:"change"
                        };
                        if (type === "list") {
                            message.delta = listDiff(newValue, oldValue);
                            $log.debug(me, "~> " + key + " delta=", message.delta);
                        } else {
                            value = angular.copy(newValue);
                            message.value = value;
                            $log.debug(me, "~> " + key + " value=", message.value);
                        }
                        return chrome.runtime.sendMessage(message);
                    }
                }, true);
            };
        }(this);
        unwatch = function(_this) {
            return function(key) {
                var _ref;
                if (typeof linkedKeys !== "undefined" && linkedKeys !== null ? (_ref = linkedKeys[key]) != null ? _ref.unwatch :void 0 :void 0) {
                    linkedKeys[key].unwatch();
                    return linkedKeys[key].unwatch = null;
                }
            };
        }(this);
        listDiff = function(newList, oldList) {
            var item, key, newDeltaItems, newDict, oldDeltaItems, oldDict, val, _i, _j, _len, _len1;
            oldDict = {};
            newDict = {};
            for (_i = 0, _len = oldList.length; _i < _len; _i++) {
                item = oldList[_i];
                oldDict[JSON.stringify(angular.copy(item))] = item;
            }
            for (_j = 0, _len1 = newList.length; _j < _len1; _j++) {
                item = newList[_j];
                newDict[JSON.stringify(angular.copy(item))] = item;
            }
            oldDeltaItems = [];
            newDeltaItems = [];
            for (key in oldDict) {
                val = oldDict[key];
                if (newDict[key] === void 0) {
                    oldDeltaItems.push(val);
                }
            }
            for (key in newDict) {
                val = newDict[key];
                if (oldDict[key] === void 0) {
                    newDeltaItems.push(val);
                }
            }
            return {
                old:oldDeltaItems,
                "new":newDeltaItems
            };
        };
        linkedKeys = {};
        _link = function(key, type) {
            var deferred, info, t;
            if (type == null) {
                type = "object";
            }
            deferred = $q.defer();
            if (!linkedKeys[key]) {
                linkedKeys[key] = {
                    unwatch:null,
                    status:null,
                    defers:[]
                };
            }
            info = linkedKeys[key];
            info.defers.push(deferred);
            if (!info.unwatch) {
                watch(key, type);
            }
            if (!info.status) {
                info.status = "pending";
                if ($rootScope[key] === void 0) {
                    $log.debug(me, "~> ? " + key);
                    t = timeUtils.milliTime();
                    chrome.runtime.sendMessage({
                        channel:channel,
                        from:me,
                        type:"ask",
                        key:key
                    }, function(message) {
                        var df, _i, _len, _ref, _results;
                        if ((message != null ? message.channel :void 0) === channel && (message != null ? message.type :void 0) === "answer" && (message != null ? message.from :void 0) !== me) {
                            $log.debug(me, "<=", timeUtils.milliTime() - t, message.from, "" + key + " =", message.value);
                            unwatch(key);
                            $rootScope.$apply(function() {
                                return $rootScope[key] = message.value;
                            });
                            watch(key, type);
                            info.status = "ready";
                            _ref = info.defers;
                            _results = [];
                            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                                df = _ref[_i];
                                _results.push(df.resolve(message.value));
                            }
                            return _results;
                        }
                    });
                    setTimeout(function() {
                        var df, _i, _len, _ref, _results;
                        if (info.status !== "ready") {
                            info.status = "ready";
                            _ref = info.defers;
                            _results = [];
                            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                                df = _ref[_i];
                                _results.push(df.resolve($rootScope[key]));
                            }
                            return _results;
                        }
                    }, 200);
                } else {
                    info.status = "ready";
                    setTimeout(function() {
                        var df, _i, _len, _ref, _results;
                        _ref = info.defers;
                        _results = [];
                        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                            df = _ref[_i];
                            _results.push(df.resolve($rootScope[key]));
                        }
                        return _results;
                    });
                }
            } else if (info.status === "ready") {
                setTimeout(function() {
                    return deferred.resolve($rootScope[key]);
                });
            }
            return deferred.promise;
        };
        this.link = function(key) {
            return _link(key);
        };
        this.linkList = function(key) {
            return _link(key, "list");
        };
        return this;
    };
    define([ "../app", "./timeUtils" ], function(app) {
        return app.service("teleScope", teleScope);
    });
}).call(this);