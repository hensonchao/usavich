(function() {
    var AccountController, LoginController, MainController, libs;
    MainController = function($scope, $rootScope, $location, $timeout, storage, track) {
        $rootScope.state = "account";
        $rootScope.name = "";
        $rootScope.isVirgin = !storage.get("lastLoginName");
        if ($rootScope.isVirgin) {
            track.event("virgin-login-0619", "visit");
        }
        $scope.source = function() {
            return $location.search().source;
        };
        return $rootScope.switchState = function(state) {
            return $rootScope.state = state;
        };
    };
    AccountController = function($scope, $rootScope, $http, $timeout, $log, validate, track, SERVER, userManager, pageManager, storage) {
        var doRegister;
        $scope.focuses = {
            name:true
        };
        $rootScope.$watch("state", function(newVal) {
            if (newVal === "account") {
                return $scope.focuses.name = true;
            }
        });
        $scope.checkName = function(name) {
            if (!name) {
                return true;
            }
            return validate.phone(name) || validate.email(name);
        };
        $scope.checkNameExistence = function() {
            var field, name;
            field = $scope.account.name;
            field.$stateVisible = true;
            name = $rootScope.name;
            if ($scope.account.$valid) {
                $scope.disableInput = true;
                return $http({
                    method:"GET",
                    url:"http://" + SERVER + "/user/",
                    params:{
                        name:name
                    }
                }).success(function(resp) {
                    $scope.disableInput = false;
                    if (resp.exists) {
                        $rootScope.switchState("login");
                        if ($rootScope.isVirgin) {
                            return track.event("virgin-login-0619", "login-start");
                        }
                    } else {
                        return doRegister();
                    }
                }).error(function() {
                    $scope.disableInput = false;
                    return alert("未知错误，可能原因是:\n1.您使用了其他代理服务器，请先关闭\n2.您的系统日期错误，请检查修正\n3.红杏服务器出错，请稍后再试");
                });
            }
        };
        return doRegister = function() {
            $scope.disableInput = true;
            return $http({
                method:"POST",
                url:"http://" + SERVER + "/user/",
                params:{
                    name:$rootScope.name,
                    action:'register'
                },
                headers:{
                    "Content-Type":"application/x-www-form-urlencoded"
                }
            }).success(function(resp) {
                if (resp.error) {
                    alert(resp.message);
                    return $scope.disableInput = false;
                } else {
                    track.pv("/chrome-extension/register/success");
                    if ($rootScope.isVirgin) {
                        track.event("virgin-login-0619", "register-success");
                    }
                    userManager.load(resp);
                    userManager.checkin().then(function() {
                        return pageManager.gotoOptions("#domains?source=afterRegister");
                    });
                    return storage.set("afterRegister", true);
                }
            }).error(function() {
                $scope.disableInput = false;
                return alert("网络错误，请稍后重试");
            });
        };
    };
    LoginController = function($scope, $rootScope, $http, $log, $timeout, userManager, pageManager, validate, track, SERVER) {
        $scope.focuses = {
            password:false
        };
        $scope.password = "";
        $scope.resetPasswordUrl = "https://" + SERVER + "/user/password/reset";
        $rootScope.$watch("state", function(state) {
            if (state === "login") {
                return $scope.focuses.password = true;
            }
        });
        return $scope.doLogin = function() {
            var field;
            field = $scope.login.password;
            field.$stateVisible = true;
            if (!$scope.login.$valid) {
                return false;
            }
            $scope.disableInput = true;
            $http({
                method:"POST",
                url:"http://" + SERVER + "/user/",
                params:{
                    name:$rootScope.name,
                    password:$scope.password,
                    action:"login"
                },
                headers:{
                    "Content-Type":"application/x-www-form-urlencoded"
                }
            }).success(function(resp) {
                if (resp.error) {
                    if (resp.error === "PASSWORD") {
                        field.$setValidity("errorPassword", false);
                    } else {
                        alert(resp.message);
                    }
                    return $scope.disableInput = false;
                } else {
                    track.pv("/chrome-extension/login/success");
                    if ($rootScope.isVirgin) {
                        track.event("virgin-login-0619", "login-success");
                    }
                    userManager.load(resp);
                    userManager.checkin().then(function() {
                        return pageManager.gotoOptions();
                    });
                    return $log.info("login ok!");
                }
            }).error(function() {
                $scope.disableInput = false;
                return alert("网络错误，请稍后重试");
            });
            return false;
        };
    };
    libs = [ "underscore", "angular", "angular_ui_keypress", "angular_ui_utils", "angular_strap_tpl", "services/domainUtils", "services/validate", "services/pageManager", "services/storage", "services/userManager", "services/track", "services/random", "directives/focusBind", "directives/fixAutoFill", "directives/formState" ];
    require([ "config" ], function() {
        return requireWithRetry(libs, function(_, angular) {
            var login;
            login = angular.module("login", [ "ui.keypress", "mgcrea.ngStrap", "app", "ui.utils" ]);
            login.controller({
                MainController:MainController,
                AccountController:AccountController,
                LoginController:LoginController
            });
            login.run(function($rootScope, track) {
                return track.pv("/chrome-extension/login");
            });
            return angular.element(document).ready(function() {
                return angular.bootstrap(document, [ "login" ]);
            });
        });
    });
}).call(this);