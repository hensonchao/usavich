(function() {
    var AlertController, AnonymousFillInfoController, ChangePasswordController, ChangePasswordModalController, DomainListController, FillPasswordController, InvitationController, MainController, ProfileController, TradeListController, domainDirective, filters, initOptions, inviterInputDirective, libs, me, optionsConfigure, __indexOf = [].indexOf || function(item) {
        for (var i = 0, l = this.length; i < l; i++) {
            if (i in this && this[i] === item) return i;
        }
        return -1;
    };
    me = "[options]";
    optionsConfigure = function($compileProvider, $stateProvider, $urlRouterProvider, $dropdownProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https?|ftp|mailto|chrome-extension):/);
        angular.extend($dropdownProvider.defaults, {
            template:"dropdown/safeDropdown.tpl.html"
        });
        $urlRouterProvider.when("/", "/domain_list");
        $stateProvider.state("main", {
            url:"/",
            templateUrl:"/partials/options/_main.html",
            controller:"MainController",
            resolve:{
                user:function(teleScope) {
                    return teleScope.link("user");
                },
                averageStability:function(teleScope) {
                    return teleScope.link("averageStability");
                }
            }
        }).state("main.trades", {
            url:"trades",
            templateUrl:"/partials/options/_trade_list.html",
            controller:"TradeListController"
        }).state("main.domains", {
            url:"domains",
            templateUrl:"/partials/options/_domain_list.html",
            controller:"DomainListController",
            resolve:{
                domains:function(teleScope) {
                    return teleScope.linkList("domains");
                }
            }
        }).state("main.invitations", {
            url:"invitations",
            templateUrl:"/partials/options/_invitation.html",
            controller:"InvitationController"
        }).state("main.blog", {
            url:"blog",
            templateUrl:"/partials/options/_blog.html"
        });
        return $urlRouterProvider.otherwise("domains");
    };
    initOptions = function($rootScope, $log, teleScope, $templateCache, pageManager, userManager, track, ROLES) {
        $templateCache.put("dropdown/safeDropdown.tpl.html", '<ul tabindex="-1" class="dropdown-menu" role="menu"><li role="presentation" ng-class="{divider: item.divider}" ng-repeat="item in content"><a role="menuitem" tabindex="-1" ng-href="{{item.href}}" ng-if="!item.divider && item.href" ng-bind="item.text"></a> <a role="menuitem" tabindex="-1" href="" ng-if="!item.divider && item.click" ng-click="$eval(item.click);$hide()" ng-bind="item.text"></a></li></ul>');
        teleScope.link("user").then(function() {
            if ($rootScope.user.role === ROLES.GUEST) {
                $log.error($rootScope.user);
                return pageManager.gotoLogin();
            }
        });
        teleScope.link("needUpgrade").then(function() {
            if ($rootScope.needUpgrade) {
                return pageManager.gotoUpgrade();
            }
        });
        $rootScope.$on("$stateChangeStart", function(evt, toState) {
            return track.pv("/chrome-extension/options/" + toState.url);
        });
        return userManager.updateProfile();
    };
    inviterInputDirective = function($rootScope, $http, $timeout, $tooltip, invitationManager, validate, SERVER) {
        return {
            restrict:"E",
            scope:{
                focusTrigger:"=manualFocus"
            },
            templateUrl:"partials/options/_inviter_input.html",
            link:function(scope, element) {
                scope.tooltipText = "";
                scope.tempInviter = "";
                scope.$watch("focusTrigger", function(val) {
                    var input;
                    if (val === true) {
                        input = element.children("form").children("input");
                        input[0].focus();
                        input[0].select();
                        return scope.focusTrigger = false;
                    }
                });
                scope.tooltipAlert = function(text) {
                    var input;
                    input = element.children("form").children("input");
                    scope.myTooltip = $tooltip(input, {
                        title:text,
                        placement:"bottom",
                        trigger:"manual"
                    });
                    $timeout(function() {
                        return scope.myTooltip.show();
                    }, 1);
                    return $timeout(function() {
                        return scope.myTooltip.hide();
                    }, 3e3);
                };
                return scope.setInviter = function() {
                    var inviter;
                    inviter = scope.tempInviter.trim();
                    if (validate.email(inviter) || validate.phone(inviter)) {
                        return $http({
                            method:"POST",
                            url:"https://" + SERVER + "/user/set_inviter",
                            params:{
                                inviter:inviter,
                                sid:$rootScope.user.profile.sid
                            },
                            headers:{
                                "Content-Type":"application/x-www-form-urlencoded"
                            }
                        }).success(function(resp) {
                            if (resp.success) {
                                $rootScope.user.inviter = inviter;
                                invitationManager.queryInviter(function(inviter) {
                                    return scope.$parent.inviter = inviter;
                                });
                                return scope.$parent.showInviterInput = false;
                            } else {
                                return scope.tooltipAlert(resp.error);
                            }
                        });
                    } else {
                        return scope.tooltipAlert("输入帐号不正确");
                    }
                };
            }
        };
    };
    domainDirective = function(domainManager, validate, $rootScope) {
        return {
            restrict:"E",
            scope:{
                domain:"=",
                status:"="
            },
            templateUrl:"partials/options/_domain.html",
            link:function(scope) {
                scope.edition = {
                    name:""
                };
                scope.updateDomain = function() {
                    var domain, newName;
                    domain = scope.domain;
                    newName = scope.edition.name.trim();
                    if (domain.name !== newName && validate.domain(newName)) {
                        if (_.findWhere($rootScope.domains, {
                            name:newName
                        })) {
                            return scope.$parent.alert("此域名已经被添加");
                        } else {
                            domainManager.update(domain.name, newName);
                            return scope.editing = false;
                        }
                    } else {
                        return scope.$parent.alert("请输入正确域名");
                    }
                };
                scope.deleteDomain = function() {
                    return domainManager.del(scope.domain.name);
                };
                return scope.edit = function(toggle) {
                    if (toggle == null) {
                        toggle = true;
                    }
                    if (toggle) {
                        scope.edition.name = scope.domain.name;
                        scope.editing = true;
                        return scope.focusInput = true;
                    } else {
                        return scope.editing = false;
                    }
                };
            }
        };
    };
    filters = {
        renderTime:function() {
            return function(d) {
                var formatInt;
                formatInt = function(i) {
                    if (i > 9) {
                        return i;
                    } else {
                        return "0" + i;
                    }
                };
                if (!d) {
                    return "---";
                } else {
                    return "" + d.getFullYear() + "-" + formatInt(d.getMonth() + 1) + "-" + formatInt(d.getDate()) + " " + formatInt(d.getHours()) + ":" + formatInt(d.getMinutes());
                }
            };
        },
        renderLeftTime:function() {
            return function(t) {
                var d, now, zeroPad;
                zeroPad = function(n, count) {
                    var i, len, s;
                    if (count == null) {
                        count = 2;
                    }
                    len = count - String(n).length;
                    if (len <= 0) {
                        return n;
                    }
                    s = function() {
                        var _i, _results;
                        _results = [];
                        for (i = _i = 0; 0 <= len ? _i < len :_i > len; i = 0 <= len ? ++_i :--_i) {
                            _results.push("0");
                        }
                        return _results;
                    }();
                    return s.concat(n).join("");
                };
                now = new Date();
                d = parseInt(t - now.getTime() / 1e3);
                if (d <= 0) {
                    return "";
                }
                if (d <= 60) {
                    return "" + d + "秒";
                } else if (d <= 3600) {
                    return "" + zeroPad(parseInt(d / 60)) + "分" + zeroPad(d % 60) + "秒";
                } else if (d <= 24 * 3600) {
                    return "" + zeroPad(parseInt(d / 3600)) + "小时" + zeroPad(parseInt(d % 3600 / 60)) + "分";
                } else {
                    return (d / 3600 / 24).toFixed(1) + "天";
                }
            };
        },
        renderPercent:function() {
            return function(p) {
                if (!p) {
                    return "1%";
                } else {
                    return parseInt(p * 1e4) / 100 + "%";
                }
            };
        },
        StabilityStyle:function() {
            return function(h) {
                if (h > .8) {
                    return "progress-bar-success";
                } else if (h > .5) {
                    return "progress-bar-warning";
                } else {
                    return "progress-bar-danger";
                }
            };
        },
        rendSorter:function() {
            return function(s) {
                if (s === "-_mtime") {
                    return "按照时间排序";
                } else if (s === "name") {
                    return "按照字母排序";
                }
            };
        },
        renderTradeType:function() {
            return function(t) {
                return "" + t + "天";
            };
        },
        renderTradeStatus:function() {
            return function(s) {
                switch (s) {
                  case "INIT":
                    return "新建";

                  case "WAIT_BUYER_PAY":
                    return "等待付款";

                  case "WAIT_SELLER_SEND_GOODS":
                    return "等待发货";

                  case "WAIT_BUYER_CONFIRM_GOODS":
                    return "等待确认收货";

                  case "TRADE_FINISHED":
                    return "成功";

                  case "TRADE_CLOSED":
                    return "交易取消";

                  default:
                    return "未知_" + s;
                }
            };
        },
        renderFloat:function() {
            return function(p) {
                return parseFloat(p).toFixed(2);
            };
        },
        tradeStyle:function() {
            return function(s) {
                var style;
                style = "";
                if (s === "INIT" || s === "WAIT_BUYER_PAY") {
                    return style = "text-muted";
                } else if (s === "TRADE_FINISHED") {
                    return style = "";
                } else if (s === "WAIT_BUYER_CONFIRM_GOODS") {
                    return style = "warning";
                } else if (s === "WAIT_SELLER_SEND_GOODS") {
                    return style = "danger";
                }
            };
        },
        renderDatetime:function() {
            return function(d) {
                var formatInt, t;
                formatInt = function(i) {
                    if (i > 9) {
                        return i;
                    } else {
                        return "0" + i;
                    }
                };
                t = new Date(d * 1e3);
                return "" + t.getFullYear() + "/" + formatInt(t.getMonth() + 1) + "/" + formatInt(t.getDate()) + " " + ("" + formatInt(t.getHours()) + ":" + formatInt(t.getMinutes()) + ":" + formatInt(t.getSeconds()));
            };
        },
        renderAccount:function($rootScope) {
            return function(account) {
                if (account === $rootScope.user.profile.name) {
                    return "我";
                } else {
                    return account;
                }
            };
        },
        isMe:function($rootScope) {
            return function(account) {
                return account === $rootScope.user.profile.name;
            };
        }
    };
    MainController = function($scope, $rootScope, $modal, $log, $location, $timeout, userManager, storage, invitationManager, pageManager, track, SERVER, ROLES, VER) {
        var VIPExpireNotifyInfo, getExpireNotify, init, setExpireNotify, showExpireAlert;
        $scope.currentState = "";
        $scope.invitationCount = 0;
        $scope.isExpireAlertShown = false;
        $scope.ver = VER;
        $rootScope.windowTitle = "红杏 " + VER;
        $rootScope.payUrl = "https://" + SERVER + "/pay/index?name=" + $rootScope.user.profile.name;
        VIPExpireNotifyInfo = storage.get("VIPExpireNotifyInfo", {});
        $scope.dropdown = [ {
            text:"修改密码",
            click:"changePassword()"
        }, {
            text:"退出登录",
            click:"logout()"
        } ];
        $scope.anonymous = function() {
            return $rootScope.user.profile.anonymous;
        };
        $scope.noPassword = function() {
            return !$rootScope.user.profile.anonymous && $rootScope.user.profile.no_password;
        };
        setExpireNotify = function(expireNotify) {
            VIPExpireNotifyInfo = storage.get("VIPExpireNotifyInfo", {});
            VIPExpireNotifyInfo[$rootScope.user.profile.name] = expireNotify;
            return storage.set("VIPExpireNotifyInfo", VIPExpireNotifyInfo);
        };
        getExpireNotify = function() {
            VIPExpireNotifyInfo = storage.get("VIPExpireNotifyInfo", {});
            return VIPExpireNotifyInfo[$rootScope.user.profile.name];
        };
        showExpireAlert = function() {
            setExpireNotify(true);
            $scope.isExpireAlertShown = true;
            return $scope.appAlert("抱歉，你的VIP已过期，请 <a class='btn btn-primary btn-xs' href='" + $rootScope.payUrl + "' target='_blank'>续费</b>");
        };
        $scope.appAlert = function(msg) {
            $scope.appAlertHtml = msg;
            return $scope.showAppAlert = true;
        };
        $scope.hideAppAlert = function() {
            $scope.showAppAlert = false;
            if ($scope.isExpireAlertShown) {
                $scope.isExpireAlertShown = false;
                return setExpireNotify(false);
            }
        };
        $scope.openAnonymousModal = function() {
            $rootScope.anonymousModal = $modal({
                template:"partials/options/_anonymous_fill_info.html",
                show:true,
                backdrop:"static"
            });
            return track.event("anonymous", "fillinfo-start");
        };
        $scope.openFillPasswordModal = function(afterRegister) {
            if (afterRegister == null) {
                afterRegister = false;
            }
            $rootScope.fillPasswordModal = $modal({
                template:"partials/options/_fill_password.html",
                show:true,
                backdrop:"static"
            });
            if (afterRegister) {
                $timeout(function() {
                    return $rootScope.$broadcast("afterRegister");
                });
            }
            return track.event("extension", "no-password", "fillpassword-start");
        };
        $scope.logout = function() {
            if ($rootScope.user.role === ROLES.VIP && $rootScope.user.profile.anonymous) {
                alert("对不起，您必须在补全帐号后才能登出");
                return $scope.openAnonymousModal();
            } else if ($scope.noPassword()) {
                alert("对不起，您必须在补全密码后才能登出,否则您将无法再次登录本账号");
                return $scope.openFillPasswordModal();
            } else {
                userManager.logout();
                return pageManager.gotoLogin("logout");
            }
        };
        $scope.changePassword = function() {
            return $rootScope.passwordModal = $modal({
                template:"partials/options/_change_password.html",
                show:true
            });
        };
        init = function(_this) {
            return function() {
                invitationManager.queryInvitationList();
                if ($rootScope.user.profile.level !== ROLES.VIP && $rootScope.user.profile.until) {
                    if (getExpireNotify() !== false) {
                        showExpireAlert();
                    }
                }
                if ($location.search().source === "anonymous") {
                    $scope.openAnonymousModal();
                }
                if ($location.search().source === "afterRegister") {
                    return $scope.openFillPasswordModal(true);
                }
            };
        }(this);
        init();
        $scope.$on("$stateChangeSuccess", function(event, toState) {
            return $scope.currentState = toState.url;
        });
        $rootScope.$watch("invitationList", function(invitationList) {
            return $scope.invitationCount = _.filter(invitationList, function(i) {
                return i.can_fetch_reward;
            }).length;
        }, true);
        return $rootScope.$watch("user.role", function(n, o) {
            if (n !== o) {
                if (n === ROLES.VIP) {
                    return $scope.appAlert("恭喜已经升级为VIP");
                } else {
                    return showExpireAlert();
                }
            }
        });
    };
    AlertController = function($scope, $location, $stateParams) {
        if ($stateParams.message) {
            return $scope.$parent.alert($stateParams.message);
        }
    };
    ProfileController = function($scope, $rootScope, $log, $http, $timeout, $interval, validate, generate, SERVER, ROLES) {
        var DEFAULT_AVATAR, init, initAvatarUrl;
        $scope.name = "";
        $scope.userRole = "";
        $scope.vip_left = 0;
        $scope.isVirgin = false;
        DEFAULT_AVATAR = "http://honx.in/static/img/logo.png";
        $scope.avatarUrl = "";
        $scope.vipLeftToolTip = {
            title:"VIP 剩余时间",
            checked:false
        };
        initAvatarUrl = function() {
            var name;
            name = $rootScope.user.profile.name;
            if (validate.email(name) && name.indexOf("@honx.in") === -1) {
                return $scope.avatarUrl = "http://www.gravatar.com/avatar" + ("/" + generate.md5(name) + "?s=50&d=") + ("" + encodeURIComponent(DEFAULT_AVATAR));
            } else {
                return $scope.avatarUrl = "";
            }
        };
        init = function() {
            $scope.userRole = "U";
            $scope.vip_left = 0;
            $scope.isVirgin = !$rootScope.user.profile.until;
            $scope.name = $rootScope.user.profile.name;
            initAvatarUrl();
            if ($rootScope.user.role === ROLES.VIP) {
                $scope.userRole = "V";
                return $scope.vip_left = $rootScope.user.profile.until;
            }
        };
        init();
        $rootScope.$watch("user.profile.name", function() {
            $scope.name = $rootScope.user.profile.name;
            return initAvatarUrl();
        });
        return $rootScope.$watch("user.profile.until", function(n, o) {
            var count, now, total_count;
            if (n !== o) {
                init();
                now = new Date();
                now = parseInt(now.getTime() / 1e3);
                if (!o || o < now) {
                    o = now;
                }
                $scope.vip_left = o;
                total_count = 30;
                count = 0;
                return $interval(function() {
                    count += 1;
                    return $scope.vip_left = (o + (n - o) * count / total_count).toFixed(0);
                }, 50, total_count);
            }
        });
    };
    DomainListController = function($scope, $rootScope, $timeout, $http, $log, $location, domainManager, domainUtils, validate, ROLES, GUEST_DOMAINS) {
        var SHAKE_CLASS, loadFilteredDomains, shakeAlert;
        $scope.domainToAdd = "";
        $scope.filteredDomains = [];
        $scope.sorter = "name";
        $scope.animateClass = "";
        SHAKE_CLASS = "animated shake";
        $scope.initTitle = $scope.title = "对以下域名按需开启科学上网（包括子域名）";
        $scope.initTitleStyle = $scope.titleStyle = "panel-success";
        $scope.dropdown = [ {
            text:"按字母排序",
            click:"setSorter('name')"
        }, {
            text:"按时间排序",
            click:"setSorter('-_mtime')"
        } ];
        $scope.isVIP = function() {
            return $rootScope.user.role === ROLES.VIP;
        };
        shakeAlert = function() {
            $scope.animateClass = "";
            return $timeout(function() {
                return $scope.animateClass = SHAKE_CLASS;
            });
        };
        if ($location.search().source === "novip") {
            shakeAlert();
        }
        loadFilteredDomains = function() {
            var name;
            if (!$scope.isVIP()) {
                $scope.guestDomains = function() {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = GUEST_DOMAINS.length; _i < _len; _i++) {
                        name = GUEST_DOMAINS[_i];
                        _results.push({
                            name:name
                        });
                    }
                    return _results;
                }();
                return $scope.filteredDomains = _.filter($rootScope.domains, function(d) {
                    var _ref;
                    return !d._deleted && (_ref = d.name, __indexOf.call(GUEST_DOMAINS, _ref) < 0);
                });
            }
        };
        loadFilteredDomains();
        $scope.alert = function(message) {
            $scope.title = message;
            $scope.titleStyle = "panel-danger";
            return $timeout(function(_this) {
                return function() {
                    $scope.title = $scope.initTitle;
                    return $scope.titleStyle = $scope.initTitleStyle;
                };
            }(this), 3e3);
        };
        $scope.addDomain = function() {
            var domainToAdd, model;
            if ($rootScope.user.role === ROLES.VIP) {
                domainToAdd = domainUtils.trimDomain($scope.domainToAdd);
                if (validate.domain(domainToAdd)) {
                    model = _.findWhere($rootScope.domains, {
                        name:domainToAdd
                    });
                    if (model) {
                        $scope.alert("此域名已经被添加，无需重复添加");
                    } else {
                        domainManager.add(domainToAdd);
                        $scope.domainToAdd = "";
                    }
                } else {
                    $scope.alert("域名不合法");
                    $scope.focusDomainInput = true;
                }
            } else {
                shakeAlert();
            }
            return false;
        };
        return $scope.setSorter = function(sorter) {
            return $scope.sorter = sorter;
        };
    };
    TradeListController = function($scope, $rootScope, $http, SERVER) {
        $scope.trades = null;
        $scope.init = function() {
            return $http.get("https://" + SERVER + "/pay/list?sid=" + $rootScope.user.profile.sid).success(function(resp) {
                if (resp.trade_list) {
                    return $scope.trades = resp.trade_list;
                }
            });
        };
        return $scope.init();
    };
    InvitationController = function($scope, $rootScope, $http, $timeout, invitationManager, SERVER) {
        var init;
        $scope.inviter = "";
        $scope.tempInviter = "";
        $scope.showInviterInput = false;
        $scope.focusInviterInput = false;
        $scope.invitationList = null;
        $scope.short_invite_url = "获取中……";
        $scope.invite_url = "";
        init = function() {
            invitationManager.queryInviter(function(inviter) {
                return $scope.inviter = inviter;
            });
            invitationManager.queryInvitationList();
            return $http({
                method:"POST",
                url:"https://" + SERVER + "/user/invite_url",
                params:{
                    sid:$rootScope.user.profile.sid
                }
            }).success(function(resp) {
                if (resp.url) {
                    $scope.invite_url = resp.url;
                    return $scope.short_invite_url = resp.url.substr(7);
                }
            });
        };
        $scope.fetchInvitationReward = function(invitation) {
            return $http({
                method:"POST",
                url:"https://" + SERVER + "/user/fetch_invitation_reward",
                params:{
                    sid:$rootScope.user.profile.sid,
                    invitation_id:invitation._id
                }
            }).success(function() {
                return invitation.can_fetch_reward = false;
            });
        };
        return init();
    };
    AnonymousFillInfoController = function($scope, $rootScope, $http, $log, SERVER, validate, track, userManager) {
        $scope.name = "";
        $scope.password = "";
        $scope.passwordInputType = "text";
        $scope.hidePassword = false;
        $scope.$watch("hidePassword", function(newVal) {
            if (newVal) {
                return $scope.passwordInputType = "password";
            } else {
                return $scope.passwordInputType = "text";
            }
        });
        $scope.closeModal = function() {
            return $rootScope.anonymousModal.destroy();
        };
        $scope.verifyNameFormat = function(name) {
            $log.info("verify name", name);
            return !name || validate.phone(name) || validate.email(name);
        };
        $scope.checkNameExists = function() {
            if ($scope.name) {
                $scope.fillInfoForm.user.$stateVisible = true;
            }
            if ($scope.fillInfoForm.user.$valid) {
                return $http({
                    method:"GET",
                    url:"https://" + SERVER + "/user/name",
                    params:{
                        name:$scope.name
                    }
                }).success(function(resp) {
                    if (resp.exists) {
                        return $scope.fillInfoForm.user.$setValidity("exists", false);
                    }
                });
            }
        };
        return $scope.fillInfo = function() {
            var field, _i, _len, _ref;
            _ref = [ "user", "password" ];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                field = _ref[_i];
                $scope.fillInfoForm[field].$stateVisible = true;
            }
            if (!$scope.fillInfoForm.$valid) {
                $scope.checkNameExists();
                return false;
            }
            $scope.disableInput = true;
            return $http({
                method:"POST",
                url:"https://" + SERVER + "/user/anonymous_fill_info",
                params:{
                    name:$scope.name,
                    password:$scope.password,
                    sid:$rootScope.user.profile.sid
                },
                headers:{
                    "Content-Type":"application/x-www-form-urlencoded"
                }
            }).success(function(resp) {
                $scope.disableInput = false;
                if (resp.error) {
                    if (resp.error === "NAME_EXISTS") {
                        return $scope.fillInfoForm.user.$setValidity("exists", false);
                    } else {
                        return alert(resp.message);
                    }
                } else {
                    track.event("anonymous", "fillinfo-success");
                    $rootScope.user.profile.name = resp.name;
                    $rootScope.user.profile.anonymous = resp.anonymous;
                    return $scope.closeModal();
                }
            }).error(function() {
                $scope.disableInput = false;
                return alert("网络错误，请稍后重试");
            });
        };
    };
    FillPasswordController = function($scope, $rootScope, $http, $log, SERVER, track, pageManager) {
        var setTag;
        $scope.password = "";
        $scope.passwordInputType = "text";
        $scope.hidePassword = false;
        $scope.afterRegister = false;
        $scope.$watch("hidePassword", function(newVal) {
            if (newVal) {
                return $scope.passwordInputType = "password";
            } else {
                return $scope.passwordInputType = "text";
            }
        });
        $scope.$on("afterRegister", function() {
            return $scope.afterRegister = true;
        });
        $scope.closeModal = function() {
            return $rootScope.fillPasswordModal.destroy();
        };
        setTag = function(tag) {
            return $http({
                method:"POST",
                url:"https://" + SERVER + "/user/set_tag",
                params:{
                    tag:tag,
                    sid:$rootScope.user.profile.sid
                },
                headers:{
                    "Content-Type":"application/x-www-form-urlencoded"
                }
            });
        };
        return $scope.fillPassword = function() {
            var field;
            field = $scope.fillPasswordForm.password;
            field.$stateVisible = true;
            if (!$scope.fillPasswordForm.$valid) {
                return false;
            }
            $scope.disableInput = true;
            return $http({
                method:"POST",
                url:"https://" + SERVER + "/user/fill_password",
                params:{
                    password:$scope.password,
                    sid:$rootScope.user.profile.sid
                },
                headers:{
                    "Content-Type":"application/x-www-form-urlencoded"
                }
            }).success(function(resp) {
                $scope.disableInput = false;
                if (resp.error) {
                    return alert(resp.message);
                } else {
                    track.event("extension", "no-password", "fill-password-success");
                    $rootScope.user.profile.no_password = resp.no_password;
                    $scope.closeModal();
                    setTag("guided");
                    return pageManager.openUrl("http://honx.in/guide?account=" + $rootScope.user.profile.name);
                }
            }).error(function() {
                $scope.disableInput = false;
                return alert("网络错误，请稍后重试");
            });
        };
    };
    ChangePasswordModalController = function($scope, $rootScope, $timeout) {
        $scope.initAlertText = "请输入 旧密码 和 2次新密码，并确认修改";
        $scope.initAlertStyle = "alert-info";
        $scope.alertText = $scope.initAlertText;
        $scope.alertStyle = $scope.initAlertStyle;
        $scope.alert = function(msg) {
            $scope.alertText = msg;
            $scope.alertStyle = "alert-danger";
            return $timeout(function() {
                $scope.alertText = $scope.initAlertText;
                return $scope.alertStyle = $scope.initAlertStyle;
            }, 2 * 1e3);
        };
        return $scope.closeModal = function() {
            return $rootScope.passwordModal.destroy();
        };
    };
    ChangePasswordController = function($scope, $rootScope, $http, SERVER) {
        $scope.oldPassword = "";
        $scope.newPassword = "";
        $scope.rePassword = "";
        $scope.focuses = {
            oldPassword:true,
            newPassword:false
        };
        $scope.alert = $scope.$parent.alert;
        $scope.closeModal = $scope.$parent.closeModal;
        $scope.submitChangePassword = function() {
            if (!$scope.oldPassword) {
                $scope.focuses.oldPassword = true;
                $scope.alert("请输入正确的旧密码");
                return false;
            } else if (!$scope.newPassword) {
                $scope.focuses.newPassword = true;
                $scope.alert("请输入至少6位新密码");
                return false;
            } else if ($scope.newPassword !== $scope.rePassword) {
                $scope.alert("2次输入的新密码不一致，请检查并修改");
                $scope.focuses.newPassword = true;
                return false;
            }
            $scope.disableInput = true;
            $http({
                method:"POST",
                url:"https://" + SERVER + "/user/password",
                params:{
                    old:$scope.oldPassword.trim(),
                    "new":$scope.newPassword.trim(),
                    sid:$rootScope.user.profile.sid
                },
                headers:{
                    "Content-Type":"application/x-www-form-urlencoded"
                }
            }).success(function(resp) {
                $scope.disableInput = false;
                if (resp.error) {
                    $scope.alert(resp.message);
                    if (resp.error === "PASSWORD_INVALID") {
                        return $scope.focuses.oldPassword = true;
                    } else if (resp.error === "NEW_PASSWORD_TOO_SHORT") {
                        return $scope.focuses.newPassword = true;
                    }
                } else {
                    $scope.alert("密码已成功修改", "success");
                    $scope.isChangingPassword = false;
                    return $scope.closeModal();
                }
            }).error(function() {
                $scope.disableInput = false;
                $scope.isChangingPassword = false;
                return $scope.alert("网络错误，请稍后重试");
            });
            $scope.disableInput = false;
            return true;
        };
        return $scope.cancelChangePassword = function() {
            $scope.isChangingPassword = false;
            return $scope.closeModal();
        };
    };
    libs = [ "underscore", "angular", "angular_ui_router", "angular_ui_keypress", "angular_ui_utils", "angular_strap_tpl", "angular_sanitize", "services/teleScope", "services/invitationManager", "services/userManager", "services/domainUtils", "services/pageManager", "services/domainManager", "services/generate", "services/validate", "directives/focusBind", "directives/resizeIframe", "directives/formState" ];
    require([ "config" ], function() {
        return requireWithRetry(libs, function(_, angular) {
            var options;
            options = angular.module("options", [ "ui.utils", "ui.router", "ui.keypress", "ngSanitize", "mgcrea.ngStrap", "app" ]);
            options.run(initOptions);
            options.config(optionsConfigure);
            options.filter(filters);
            options.directive("inviterInput", inviterInputDirective);
            options.directive("domain", domainDirective);
            options.controller({
                MainController:MainController,
                AlertController:AlertController,
                ProfileController:ProfileController,
                DomainListController:DomainListController,
                TradeListController:TradeListController,
                InvitationController:InvitationController,
                AnonymousFillInfoController:AnonymousFillInfoController,
                ChangePasswordModalController:ChangePasswordModalController,
                ChangePasswordController:ChangePasswordController,
                FillPasswordController:FillPasswordController
            });
            return angular.element(document).ready(function() {
                return angular.bootstrap(document, [ "options" ]);
            });
        });
    });
}).call(this);