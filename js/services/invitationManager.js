(function() {
    var invitationManager;
    invitationManager = function($window, $rootScope, $log, $http, $timeout, SERVER) {
        var _inviter;
        this.queryInvitationList = function() {
            return $http.get("https://" + SERVER + "/user/invitation_list?sid=" + $rootScope.user.profile.sid).success(function(resp) {
                if (resp.invitation_list) {
                    return $rootScope.invitationList = resp.invitation_list;
                }
            });
        };
        _inviter = "";
        this.queryInviter = function(callback) {
            var inviterQueryUrl;
            if (!_inviter) {
                inviterQueryUrl = "https://" + SERVER + "/user/get_inviter?sid=" + $rootScope.user.profile.sid;
                return $http.get(inviterQueryUrl).success(function(resp) {
                    _inviter = resp.inviter;
                    return callback(_inviter);
                });
            } else {
                return $timeout(function() {
                    return callback(_inviter);
                });
            }
        };
        return this;
    };
    define([ "../app" ], function(app) {
        return app.service("invitationManager", invitationManager);
    });
}).call(this);