(function() {
	var libs, proxyManager, __indexOf = [].indexOf ||
	function(item) {
		for (var i = 0,
		l = this.length; i < l; i++) {
			if (i in this && this[i] === item) return i
		}
		return - 1
	};
	proxyManager = function($rootScope, $log, teleScope, server, storage, domainManager, timeUtils, MODES, ROLES, WHITE_LIST_DOMAINS) {
		var bindEvents, calcAverageStability, calcEvaluation, ensureValid, generateAndApplyConfig, generatePacScript, isBlocked, load, loadFromServer, me, pxsInfo, save, sortProxies, _lastReportTime;
		me = '[proxyManager]';
		$rootScope.proxies = [];
		$rootScope.averageStability = 1;
		$rootScope.mode = MODES.AUTO;
		$rootScope.blocked = false;
		_lastReportTime = timeUtils.time();
		ensureValid = function(attrsList) {
			var attrs, key, val, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
			for (_i = 0, _len = attrsList.length; _i < _len; _i++) {
				attrs = attrsList[_i];
				_ref = ['name', 'group', 'scheme', 'host'];
				for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
					key = _ref[_j];
					val = attrs[key];
					if (!val || !_.isString(val)) {
						attrs[key] = ''
					}
				}
				_ref1 = ['port', 'latency', 'speed', 'latencyTestTime', 'speedTestTime'];
				for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
					key = _ref1[_k];
					val = attrs[key];
					if (!_.isNumber(val)) {
						attrs[key] = 0
					}
				}
				if (!_.isNumber(attrs.fail)) {
					attrs.fail = -1
				}
				if (!_.isNumber(attrs.stability)) {
					attrs.stability = -1
				}
			}
			return attrsList
		};
		loadFromServer = function(proxies) {
			var k, model, p, valid_proxies, _i, _j, _len, _len1, _ref;
			valid_proxies = ensureValid(proxies);
			for (_i = 0, _len = valid_proxies.length; _i < _len; _i++) {
				p = valid_proxies[_i];
				model = _.findWhere($rootScope.proxies, {
					name: p.name
				});
				if (model) {
					_ref = ['latency', 'fail', 'stability', 'speed', 'latencyTestTime', 'speedTestTime'];
					for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
						k = _ref[_j];
						p[k] = model[k]
					}
				}
			}
			$rootScope.proxies = valid_proxies;
			return sortProxies()
		};
		calcAverageStability = function() {
			var stabilities;
			stabilities = _.pluck($rootScope.proxies, 'stability');
			if (stabilities.length) {
				return _.reduce(stabilities,
				function(a, b) {
					return a + b
				}) / stabilities.length
			} else {
				return 1
			}
		};
		calcEvaluation = function(proxy) {
			var latency, latencyScore, speed, speedScore, stabilityScore;
			stabilityScore = Math.pow(proxy.stability, 2);
			speed = proxy.speed;
			latency = proxy.latency;
			if (speed) {
				speedScore = speed > 500 ? 1 : 1 - Math.pow(1 - speed / 500, 2)
			} else {
				speedScore = 0.5
			}
			if (latency) {
				if (latency <= 1000) {
					latencyScore = 1 - Math.pow(latency / 1000, 2) / 3
				} else if (latency < 3000) {
					latencyScore = Math.pow((3000 - latency) / 2000, 2) * 2 / 3
				} else {
					latencyScore = 0
				}
			} else {
				latencyScore = 0.5
			}
			return parseFloat(((0.6 * speedScore + 0.4 * latencyScore) * stabilityScore).toFixed(2))
		};
		sortProxies = function() {
			return $rootScope.proxies = _.sortBy($rootScope.proxies,
			function(p) {
				return - calcEvaluation(p)
			})
		};
		pxsInfo = function() {
			var p;
			return [(function() {
				var _i, _len, _ref, _results;
				_ref = $rootScope.proxies;
				_results = [];
				for (_i = 0, _len = _ref.length; _i < _len; _i++) {
					p = _ref[_i];
					_results.push(p.name)
				}
				return _results
			})(), (function() {
				var _i, _len, _ref, _results;
				_ref = $rootScope.proxies;
				_results = [];
				for (_i = 0, _len = _ref.length; _i < _len; _i++) {
					p = _ref[_i];
					_results.push(parseInt(p.stability * 100) / 100)
				}
				return _results
			})(), (function() {
				var _i, _len, _ref, _results;
				_ref = $rootScope.proxies;
				_results = [];
				for (_i = 0, _len = _ref.length; _i < _len; _i++) {
					p = _ref[_i];
					_results.push(p.fail)
				}
				return _results
			})(), (function() {
				var _i, _len, _ref, _results;
				_ref = $rootScope.proxies;
				_results = [];
				for (_i = 0, _len = _ref.length; _i < _len; _i++) {
					p = _ref[_i];
					_results.push(p.latency)
				}
				return _results
			})(), (function() {
				var _i, _len, _ref, _results;
				_ref = $rootScope.proxies;
				_results = [];
				for (_i = 0, _len = _ref.length; _i < _len; _i++) {
					p = _ref[_i];
					_results.push(parseFloat(p.speed.toFixed(2)))
				}
				return _results
			})(), (function() {
				var _i, _len, _ref, _results;
				_ref = $rootScope.proxies;
				_results = [];
				for (_i = 0, _len = _ref.length; _i < _len; _i++) {
					p = _ref[_i];
					_results.push(calcEvaluation(p))
				}
				return _results
			})()]
		};
		isBlocked = function() {
			return _.all($rootScope.proxies,function(proxy) {
				return proxy.fail > 0
			}) || $rootScope.proxies.length === 0
		};
		generateAndApplyConfig = timeUtils.throttle(function() {
			var config;
			if ($rootScope.mode === MODES.NEVER || $rootScope.user.role === ROLES.GUEST) {
				chrome.proxy.settings.clear({})
			} else {
				config = {
					mode: 'pac_script',
					pacScript: {
						data: generatePacScript()
					}
				};
				chrome.proxy.settings.set({
					value: config,
					scope: 'regular'
				},
				(function(_this) {
					return function() {
						return null
					}
				})(this))
			}
			return $log.debug(me, '_generateAndApplyConfig')
		},
		500);
		generatePacScript = function() {
			var domain, i, lines, mode, node, part, parts, proxy, proxyString, proxyStrings, reversedDomainTree, scheme, source, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _ref2;
			mode = $rootScope.mode;
			if (mode !== MODES.AUTO && mode !== MODES.ALWAYS) {
				mode = MODES.AUTO
			}
			proxyStrings = [];
			_ref = $rootScope.proxies || [];
			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
				proxy = _ref[_i];
				scheme = proxy.scheme;
				proxyStrings.push("" + scheme + " " + proxy.host + ":" + proxy.port)
			}
			proxyString = proxyStrings.join(';');
			lines = [];
			lines.push(['function Find', 'roxyForURL(url, host) {\n'].join('P'));
			lines.push("var D = \"DIRECT\";");
			lines.push("var p='" + proxyString + "';\n");
			lines.push("if (shExpMatch(host, '10.[0-9]+.[0-9]+.[0-9]+')) return D;");
			lines.push("if (shExpMatch(host, '172.[0-9]+.[0-9]+.[0-9]+')) return D;");
			lines.push("if (shExpMatch(host, '192.168.[0-9]+.[0-9]+')) return D;");
			lines.push("if (dnsDomainIs(host, 'localhost')) return D;\n");
			lines.push("if (url.indexOf('https://www.google.com/complete/search?client=chrome-omni') == 0)");
			lines.push("\treturn D;");
			lines.push("if (url.indexOf('http://clients1.google.com/generate_204') == 0)");
			lines.push("\treturn D;");
			lines.push("if (url.indexOf('http://chart.apis.google.com/') == 0)");
			lines.push("\treturn D;");
			lines.push("if (url.indexOf('http://toolbarqueries.google.com') == 0)");
			lines.push("\treturn D;\n");
			lines.push("if (url.indexOf('_HXPROXY=') >= 0) \treturn D;\n");
			for (_j = 0, _len1 = WHITE_LIST_DOMAINS.length; _j < _len1; _j++) {
				domain = WHITE_LIST_DOMAINS[_j];
				lines.push("if (dnsDomainIs(host, '" + domain + "')) return D;")
			}
			lines.push("\n");
			if (mode === MODES.AUTO) {
				reversedDomainTree = {};
				_ref1 = domainManager.domainNames();
				for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
					domain = _ref1[_k];
					node = reversedDomainTree;
					parts = domain.toLowerCase().split('.').reverse();
					for (i = _l = 0, _ref2 = parts.length - 1; 0 <= _ref2 ? _l <= _ref2: _l >= _ref2; i = 0 <= _ref2 ? ++_l: --_l) {
						part = parts[i];
						if (i === parts.length - 1) {
							node[part] = 1
						} else {
							if (node[part] === 1) {
								break
							}
							if (node[part] == null) {
								node[part] = {}
							}
							node = node[part]
						}
					}
				}
				lines.push("var node = " + (JSON.stringify(reversedDomainTree)) + ";");
				lines.push("var hostParts = host.toLowerCase().split('.');");
				lines.push("for (var i=hostParts.length - 1; i >= 0; i --) {");
				lines.push("    var part = hostParts[i];");
				lines.push("    node = node[part];");
				lines.push("    if (node == undefined || node == 1) break;");
				lines.push("}");
				lines.push("if (node == 1)");
				lines.push("    return p;\n")
			} else {
				lines.push('return p;')
			}
			lines.push('return D;');
			lines.push("}");
			source = lines.join('\n');
			return source;
		};
		this.setSpeed = function(proxy, speed) {
			var oldSpeed, ret;
			oldSpeed = proxy.speed;
			if (oldSpeed) {
				ret = speed * 0.25 + oldSpeed * 0.75
			} else {
				ret = speed
			}
			return proxy.speed = parseFloat(ret.toFixed(2))
		};
		this.setLatency = function(proxy, latency) {
			var oldLatency, ret;
			oldLatency = proxy.latency;
			if (oldLatency) {
				ret = parseInt(latency * 0.25 + oldLatency * 0.75)
			} else {
				ret = parseInt(latency)
			}
			return proxy.latency = ret
		};
		this.setStability = function(proxy, stability) {
			var oldStability, ret;
			oldStability = proxy.stability;
			if (oldStability === -1) {
				ret = stability
			} else {
				ret = oldStability * 0.75 + 0.25 * stability
			}
			return proxy.stability = parseFloat(ret.toFixed(3))
		};
		this.getProxyByName = function(name) {
			return _.findWhere($rootScope.proxies, {
				name: name
			})
		};
		load = function(data) {
			if (data == null) {
				data = void 0
			}
			if (data) {
				return $rootScope.proxies = ensureValid(data);
			} else {
                            return $rootScope.proxies = ensureValid(storage.get('proxies', []));
			}
		};
		save = function() {
			storage.set('proxies', $rootScope.proxies);
			return storage.set('mode', $rootScope.mode)
		};
		bindEvents = function() {
                    server.on('proxies', function(resp) {
                        if (resp && !resp.error && resp.length > 0) {
                                loadFromServer(resp)
                        }
                        return $rootScope.proxies;
                    });
			$rootScope.$watch('user.role',
			function() {
				return generateAndApplyConfig()
			});
			$rootScope.$watch('mode',
			function(mode) {
				generateAndApplyConfig();
				return storage.set('mode', mode)
			});
			$rootScope.$watch('domains',
			function() {
				return generateAndApplyConfig()
			},
			true);
			return $rootScope.$watch('proxies', function(n, p) {
				var minSameResultCount, newOrders, oldOrders, proxy, reportWait;
				$rootScope.blocked = isBlocked();
				$rootScope.averageStability = calcAverageStability();
				if (! (__indexOf.call((function() {
					var _i, _len, _ref, _results;
					_ref = $rootScope.proxies;
					_results = [];
					for (_i = 0, _len = _ref.length; _i < _len; _i++) {
						p = _ref[_i];
						_results.push(p.stability)
					}
					return _results
				})(), -1) >= 0)) {
					oldOrders = (function() {
						var _i, _len, _ref, _results;
						_ref = $rootScope.proxies;
						_results = [];
						for (_i = 0, _len = _ref.length; _i < _len; _i++) {
							p = _ref[_i];
							_results.push(p.host)
						}
						return _results
					})();
					sortProxies();
					newOrders = (function() {
						var _i, _len, _ref, _results;
						_ref = $rootScope.proxies;
						_results = [];
						for (_i = 0, _len = _ref.length; _i < _len; _i++) {
							p = _ref[_i];
							_results.push(p.host)
						}
						return _results
					})();
					if (!_.isEqual(oldOrders, newOrders)) {
						$log.info(me, 'Reseting Proxies!!!', oldOrders, newOrders);
						generateAndApplyConfig();
						_lastReportTime = timeUtils.time();
						server.emit('pxs', pxsInfo())
					} else {
						minSameResultCount = _.min((function() {
							var _i, _len, _ref, _results;
							_ref = $rootScope.proxies;
							_results = [];
							for (_i = 0, _len = _ref.length; _i < _len; _i++) {
								proxy = _ref[_i];
								_results.push(Math.abs(proxy.fail))
							}
							return _results
						})());
						reportWait = Math.min(300, 10 + 300 * Math.pow(minSameResultCount / 5, 2));
						if (_lastReportTime + reportWait < timeUtils.time()) {
							_lastReportTime = timeUtils.time();
							server.emit('pxs', pxsInfo())
						}
					}
				}
				return save()
			}, true);
		};
		this.init = function() {
			load();
			$rootScope.mode = storage.get('mode', MODES.AUTO);
			$rootScope.blocked = isBlocked();
			teleScope.link('averageStability');
			teleScope.link('mode');
			generateAndApplyConfig();
			bindEvents();
			$log.info(me, 'proxyManager Ready!');
			return window.showProxies = function() {
				var item, proxies;
				proxies = (function() {
					var _i, _len, _ref, _results;
					_ref = $rootScope.proxies;
					_results = [];
					for (_i = 0, _len = _ref.length; _i < _len; _i++) {
						item = _ref[_i];
						_results.push(_.omit(item, 'host', 'port'))
					}
					return _results
				})();
				return console.table(proxies)
			}
		};
		return this
	};
	libs = ['underscore', '../app', './teleScope', './server', './storage', './domainManager', './timeUtils'];
	define(libs, (function(_this) {
		return function(_, app) {
			return app.service('proxyManager', proxyManager)
		}
	})(this))
}).call(this);