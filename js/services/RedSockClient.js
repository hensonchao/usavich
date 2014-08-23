(function() {
    var __slice = [].slice;
    define([ "../app", "./timeUtils" ], function(app) {
        var ACK_TIMEOUT, HEARTBEAT_INTERVAL, HEARTBEAT_TIMEOUT, MT_ACK, MT_DISCONNECT, MT_EVENT, MT_HEARTBEAT, RedSockClient, decodeMessage, encodeMessage, me;
        me = "[RedSockClient]";
        ACK_TIMEOUT = 5 * 1e3;
        HEARTBEAT_INTERVAL = 8 * 1e3;
        HEARTBEAT_TIMEOUT = 17 * 1e3;
        MT_DISCONNECT = 0;
        MT_HEARTBEAT = 2;
        MT_EVENT = 3;
        MT_ACK = 4;
        encodeMessage = function(_this) {
            return function(messageType, ackId, name, data) {
                if (ackId == null) {
                    ackId = "";
                }
                if (name == null) {
                    name = "";
                }
                if (data == null) {
                    data = "";
                }
                if (messageType === 2) {
                    return "2";
                } else {
                    return JSON.stringify([ messageType, ackId, name, data ]);
                }
            };
        }(this);
        decodeMessage = function(_this) {
            return function(blob) {
                var error;
                if (blob === "2") {
                    return [ 2, "", "", "" ];
                }
                try {
                    return JSON.parse(blob);
                } catch (_error) {
                    error = _error;
                    return [ 2, "", "", "" ];
                }
            };
        }(this);
        RedSockClient = function($log, timeUtils) {
            var creator;
            creator = function(url) {
                var _ack, _ackId, _ackMap, _applyOnCallbacks, _connect, _foreverHeartBeat, _lastBeat, _onMap, _retrial, _send, _stopHeartBeat, _timerHeartBeat, _timerReconnect, _tryReconnect, _ws;
                _onMap = {
                    connect:[],
                    connecting:[],
                    reconnect:[],
                    reconnecting:[],
                    disconnect:[]
                };
                _ackMap = {};
                _lastBeat = 0;
                _ackId = 1;
                _ws = null;
                _retrial = 0;
                _timerHeartBeat = null;
                _timerReconnect = null;
                _applyOnCallbacks = function(_this) {
                    return function(name, data) {
                        var callback, li, _i, _len, _results;
                        li = _onMap[name];
                        if (li && li.length > 0) {
                            _results = [];
                            for (_i = 0, _len = li.length; _i < _len; _i++) {
                                callback = li[_i];
                                console.log(name);
                                _results.push(callback(data));
                            }
                            return _results;
                        }
                    };
                }(this);
                this.alive = function(_this) {
                    return function() {
                        return _ws && _ws.readyState === 1;
                    };
                }(this);
                this.connect = function(_this) {
                    return function() {
                        _retrial = 0;
                        return _connect();
                    };
                }(this);
                _connect = function(_this) {
                    return function() {
                        $log.log(me, "begin to connect " + url);
                        _timerReconnect = null;
                        if (_retrial > 0) {
                            _applyOnCallbacks("reconnecting", _retrial);
                        } else {
                            _applyOnCallbacks("connecting");
                        }
                        _ws = new WebSocket(url);
                        _ws.onopen = function() {
                            $log.log(me, "onopen", url);
                            _lastBeat = timeUtils.milliTime();
                            console.log('connect');
                            if (_retrial > 0) {
                                _applyOnCallbacks("reconnect", _retrial);
                            } else {
                                console.log('connect');
                                _applyOnCallbacks("connect");
                            }
                            _retrial = 0;
                            return _foreverHeartBeat();
                        };
                        _ws.onmessage = function(e) {
                            var ackId, callback, callbacks, data, messageType, name, _i, _len, _ref, _results;
                            if (e.data !== "2") {
                                $log.debug(me, ">>>", e.data);
                            }
                            _lastBeat = timeUtils.milliTime();
                            _ref = decodeMessage(e.data), messageType = _ref[0], ackId = _ref[1], name = _ref[2], 
                            data = _ref[3];
                            switch (messageType) {
                              case MT_DISCONNECT:
                                return _this.disconnect();

                              case MT_HEARTBEAT:
                                return null;

                              case MT_EVENT:
                                callbacks = _onMap[name];
                                if (callbacks && callbacks.length > 0) {
                                    _results = [];
                                    for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
                                        callback = callbacks[_i];
                                        if (typeof callback === "function") {
                                            if (ackId) {
                                                _results.push(_ack(ackId, callback(data)));
                                            } else {
                                                _results.push(callback(data));
                                            }
                                        } else {
                                            if (ackId) {
                                                _results.push(_ack(ackId));
                                            } else {
                                                _results.push(void 0);
                                            }
                                        }
                                    }
                                    return _results;
                                }
                                break;

                              case MT_ACK:
                                return typeof _ackMap[ackId] === "function" ? _ackMap[ackId](data) :void 0;

                              default:
                                return $log.error(me, "Invalid MessageType:", messageType);
                            }
                        };
                        return _ws.onclose = function() {
                            $log.debug(me, "onclose", url);
                            _stopHeartBeat();
                            if (_retrial >= 0) {
                                return _tryReconnect();
                            } else {
                                return _applyOnCallbacks("disconnect");
                            }
                        };
                    };
                }(this);
                _send = function(_this) {
                    return function(data) {
                        if (_this.alive()) {
                            if (data !== "2") {
                                $log.debug(me, "<<<", data);
                            }
                            return _ws.send(data);
                        } else {
                            if (data !== "2") {
                                return $log.debug(me, "not alive, cannot send", data);
                            }
                        }
                    };
                }(this);
                _ack = function(_this) {
                    return function(ackId, data) {
                        var message;
                        message = encodeMessage(MT_ACK, ackId, null, data);
                        return _send(message);
                    };
                }(this);
                _tryReconnect = function(_this) {
                    return function() {
                        var delay;
                        if (!_timerReconnect) {
                            _retrial += 1;
                            delay = Math.min(1e3 * .5 * Math.pow(2, _retrial - 1), 20 * 1e3);
                            $log.warn(me, "Reconnect in " + delay + " ms (" + _retrial + ")");
                            return _timerReconnect = setTimeout(_connect, delay);
                        }
                    };
                }(this);
                _foreverHeartBeat = function(_this) {
                    return function() {
                        return _timerHeartBeat = setInterval(function() {
                            if (_timerHeartBeat) {
                                _send(encodeMessage(MT_HEARTBEAT));
                            }
                            if (timeUtils.milliTime() - _lastBeat > HEARTBEAT_TIMEOUT) {
                                return _ws.close();
                            }
                        }, HEARTBEAT_INTERVAL);
                    };
                }(this);
                _stopHeartBeat = function(_this) {
                    return function() {
                        if (_timerHeartBeat) {
                            clearInterval(_timerHeartBeat);
                            return _timerHeartBeat = null;
                        }
                    };
                }(this);
                this.disconnect = function(_this) {
                    return function() {
                        _retrial = -1;
                        return _ws.close();
                    };
                }(this);
                this.emit = function(_this) {
                    return function() {
                        var ackId, callback, data, message, name, rest;
                        name = arguments[0], rest = 2 <= arguments.length ? __slice.call(arguments, 1) :[];
                        try {
                            data = "";
                            callback = void 0;
                            if (rest.length >= 2) {
                                data = rest[0];
                                callback = rest[1];
                            } else if (rest.length === 1) {
                                if (typeof rest[0] === "function") {
                                    callback = rest[0];
                                } else {
                                    data = rest[0];
                                }
                            }
                            ackId = "";
                            if (callback) {
                                ackId = _ackId;
                                _ackMap[ackId] = callback;
                                _ackId += 1;
                                setTimeout(function() {
                                    if (_ackMap[ackId]) {
                                        return delete _ackMap[ackId];
                                    }
                                }, ACK_TIMEOUT);
                            }
                            message = encodeMessage(MT_EVENT, ackId, name, data);
                            return _send(message);
                        } catch (_error) {}
                    };
                }(this);
                this.on = function(_this) {
                    return function(name, callback) {
                        if (_onMap[name] == null) {
                            _onMap[name] = [];
                        }
                        return _onMap[name].push(callback);
                    };
                }(this);
                return this;
            };
            this.create = function(url) {
                return new creator(url);
            };
            return this;
        };
        return app.service("RedSockClient", RedSockClient);
    });
}).call(this);