(function() {
    var AddController, ConflictController, FooterController, MenuController, libs, popupConfigure, popupRun, __indexOf = [].indexOf || function(item) {
        for (var i = 0, l = this.length; i < l; i++) {
            if (i in this && this[i] === item) return i;
        }
        return -1;
    };
    popupConfigure = function($compileProvider, $routeProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome):/);
        return $routeProvider.when("/menu", {
            templateUrl:"/partials/popup/_menu.html",
            controller:"MenuController",
            resolve:{
                mode:function(teleScope) {
                    return teleScope.link("mode");
                },
                currentTab:function(teleScope) {
                    return teleScope.link("currentTab");
                },
                blockedDomains:function(teleScope) {
                    return teleScope.link("blockedDomains");
                },
                user:function(teleScope) {
                    return teleScope.link("user");
                },
                domains:function(teleScope) {
                    return teleScope.linkList("domains");
                }
            }
        }).when("/add/:name", {
            templateUrl:"/partials/popup/_add.html",
            controller:"AddController"
        }).when("/conflict", {
            templateUrl:"/partials/popup/_conflict.html",
            controller:"ConflictController",
            resolve:{
                conflicts:function(teleScope) {
                    return teleScope.link("conflicts");
                }
            }
        }).otherwise({
            redirectTo:"/menu"
        });
    };
    popupRun = function($location, teleScope, $rootScope, $timeout, track) {
        $timeout(function() {
            return track.pv("/chrome-extension/popup");
        }, 500);
        return teleScope.link("conflicts").then(function() {
            if ($rootScope.conflicts.length > 0) {
                return $location.path("/conflict");
            }
        });
    };
    MenuController = function($scope, $rootScope, $window, $location, $log, pageManager, domainUtils, domainManager, MODES, ROLES) {
        var topDomain;
        $scope.blockedDomains = [];
        $scope.currentDomain = "";
        $scope.currentDomainIsAdded = "no";
        $scope.addTooltip = {
            title:"添加网站",
            checked:false
        };
        $scope.state = "normal";
        $scope.anonymous = $rootScope.user.profile.anonymous;
        topDomain = function(tab) {
            var host;
            if (!(tab != null ? tab.url :void 0)) {
                return;
            }
            host = domainUtils.parseUri(tab.url).host;
            return domainUtils.topDomain(host);
        };
        $scope.init = function() {
            var name;
            $scope.blockedDomains = function() {
                var _i, _len, _ref, _results;
                _ref = $rootScope.blockedDomains;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    name = _ref[_i];
                    _results.push({
                        name:name,
                        selected:true
                    });
                }
                return _results;
            }();
            $scope.currentDomain = topDomain($rootScope.currentTab);
            $scope.currentDomainIsAdded = domainManager.coversDomain($scope.currentDomain) ? "yes" :"no";
            return $scope.state = $scope.blockedDomains.length > 0 ? "blocked" :"normal";
        };
        $scope.init();
        $scope.openOptions = function(mode) {
            if (mode == null) {
                mode = "";
            }
            if (mode) {
                return pageManager.openOptions("#/domains?source=" + mode, $window.close);
            } else {
                return pageManager.openOptions("", $window.close);
            }
        };
        $scope.switchMode = function(mode) {
            if (mode !== $rootScope.mode) {
                if (mode === MODES.ALWAYS && $rootScope.user.role !== ROLES.VIP) {
                    $scope.openOptions("novip");
                } else {
                    $rootScope.mode = mode;
                }
            }
            return false;
        };
        $scope.addDomain = function(name) {
            if ($rootScope.user.role !== ROLES.VIP) {
                $scope.openOptions("novip");
                return false;
            } else {
                domainManager.add(name);
                return pageManager.reloadCurrentTabAndClosePopup();
            }
        };
        $scope.deleteDomain = function(name) {
            if ($rootScope.user.role !== ROLES.VIP) {
                $scope.openOptions("novip");
                return false;
            } else {
                domainManager.del(name);
                return pageManager.reloadCurrentTabAndClosePopup();
            }
        };
        $scope.addSelectedDomains = function() {
            var name, names, _i, _len;
            if ($rootScope.user.role !== ROLES.VIP) {
                $scope.openOptions("novip");
                return false;
            } else {
                names = _.pluck(_.where($scope.blockedDomains, {
                    selected:true
                }), "name");
                for (_i = 0, _len = names.length; _i < _len; _i++) {
                    name = names[_i];
                    domainManager.add(name);
                }
                return pageManager.reloadCurrentTabAndClosePopup();
            }
        };
        return $scope.routeToAdd = function() {
            if ($rootScope.user.role !== ROLES.VIP) {
                $scope.openOptions("novip");
                return false;
            } else {
                return $location.path("/add/" + $scope.currentDomain);
            }
        };
    };
    AddController = function($scope, $routeParams, $location, $log, pageManager, domainManager) {
        $log.log("route", $scope, $routeParams);
        $scope.name = $routeParams.name;
        $scope.routeToMenu = function(_this) {
            return function() {
                return $location.path("/menu");
            };
        }(this);
        return $scope.addDomain = function(_this) {
            return function() {
                if ($scope.name && __indexOf.call($scope.name, ".") >= 0) {
                    domainManager.add($scope.name);
                }
                return pageManager.reloadCurrentTabAndClosePopup();
            };
        }(this);
    };
    ConflictController = function($scope, $rootScope, $window, pageManager) {
        $scope.extensions = function() {
            return $rootScope.conflicts;
        };
        return $scope.openExtensionPage = function(_this) {
            return function(id) {
                var url;
                url = "chrome://extensions";
                if (id) {
                    url += "/?id=" + id;
                }
                return pageManager.openUrl(url, $window.close);
            };
        }(this);
    };
    FooterController = function($scope, $rootScope, teleScope, ROLES) {
        $scope.show = false;
        return teleScope.link("user").then(function() {
            return $scope.vip = $rootScope.user.role === ROLES.VIP;
        });
    };
    libs = [ "underscore", "angular", "angular_route", "angular_animate", "angular_strap", "angular_strap_tpl", "angular_sanitize", "services/domainUtils", "services/teleScope", "services/pageManager", "services/domainManager", "services/track" ];
    require([ "config" ], function() {
        return require(libs, function(){
            var popup;
            popup = angular.module("popup", [ "ngRoute", "ngAnimate", "ngSanitize", "mgcrea.ngStrap.tooltip", "app" ]);
            popup.config(popupConfigure);
            popup.run(popupRun);
            popup.controller({
                MenuController:MenuController,
                AddController:AddController,
                ConflictController:ConflictController,
                FooterController:FooterController
            });
            return angular.element(document).ready(function() {
                return angular.bootstrap(document, [ "popup" ]);
            });
        });
    });
}).call(this);