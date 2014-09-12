(function() {
    var API_URL, DEBUG, DEFAULT_DOMAINS, GA_ACCOUNT, GUEST_DOMAINS, LOG_URL, MODES, ROLES, RavenConfig, SERVER, WHITE_LIST_DOMAINS, enableLog, globalLog, manifest, oldLog, _ref;
    oldLog = null;
    globalLog = null;
    enableLog = function(enable) {
        if (!oldLog) {
            oldLog = {
                log:globalLog.log,
                info:globalLog.info,
                warn:globalLog.warn,
                error:globalLog.error,
                debug:globalLog.debug
            };
        }
        if (!enable) {
            globalLog.log = angular.noop;
            globalLog.info = angular.noop;
            globalLog.warn = angular.noop;
            globalLog.error = angular.noop;
            return globalLog.debug = angular.noop;
        } else {
            globalLog.log = oldLog.log;
            globalLog.info = oldLog.info;
            globalLog.warn = oldLog.warn;
            globalLog.error = oldLog.error;
            return globalLog.debug = oldLog.debug;
        }
    };
    manifest = chrome.runtime.getManifest();
    RavenConfig = {
        ravenUrl:"http://test_raven@",
        options:{
            logger:"hongx-js-" + (manifest != null ? manifest.version :void 0)
        }
    };
    GA_ACCOUNT = "UA-54110783-1";
    SERVER = "usavich.wang";
    API_URL = "ws://" + SERVER + ":8888/";
    LOG_URL = "http://" + SERVER + ":8888/log";
    MODES = {
        AUTO:"auto",
        ALWAYS:"always",
        NEVER:"never"
    };
    ROLES = {
        GUEST:"guest",
        USER:"user",
        VIP:"VIP"
    };
    GUEST_DOMAINS = [ "akamaihd.net", "facebook.com", "facebook.net", "fbcdn.net", "twitter.com", "t.co", "twimg.com", "google.com", "google.com.hk", "googleusercontent.com", "googleapis.com", "gstatic.com", "gmail.com", "honx.in" ];
    DEFAULT_DOMAINS = GUEST_DOMAINS.concat([ "cloudfront.net", "tumblr.com", "sstatic.net", "appspot.com", "s3.amazonaws.com", "blogspot.com", "blogger.com", "mediafire.com", "ytimg.com", "youtube.com", "googlevideo.com", "youtube-nocookie.com", "wordpress.com", "vimeo.com", "bit.ly", "googlesyndication.com", "youtu.be", "ggpht.com", "doubleclick.net", "2mdn.net", "imgur.com", "googleadservices.com", "cloudflare.com" ]);
    WHITE_LIST_DOMAINS = [ "0.0.0.0", "127.0.0.1", "localhost", SERVER ];
    DEBUG = (typeof chrome !== "undefined" && chrome !== null ? (_ref = chrome.runtime) != null ? _ref.id :void 0 :void 0) === "heehjpdocpefckjobfgnfdbhoebhphkf" ? false :true;
	require([ "raven" ], function(Raven) {
        manifest = chrome.runtime.getManifest();
        return Raven.config(RavenConfig.ravenUrl, {
            logger:"hongx-js-" + (manifest != null ? manifest.version :void 0)
        }).install();
    });
    define([ "angular", "angular_raven", "angular_log_ex" ], function(angular) {
        var app;
        app = angular.module("app", [ "angular-raven", "log.ex.uo" ]);
        app.value("RavenConfig", RavenConfig);
        app.constant({
            manifest:manifest,
            VER:manifest.version,
            GA_ACCOUNT:GA_ACCOUNT,
            SERVER:SERVER,
            API_URL:API_URL,
            LOG_URL:LOG_URL,
            MODES:MODES,
            ROLES:ROLES,
            GUEST_DOMAINS:GUEST_DOMAINS,
            DEFAULT_DOMAINS:DEFAULT_DOMAINS,
            WHITE_LIST_DOMAINS:WHITE_LIST_DOMAINS
        });
        app.config(function(logExProvider) {
            return logExProvider.enableLogging(true);
        });
        app.run(function($log) {
            globalLog = $log;
            enableLog(DEBUG);
            return window.enableLog = enableLog;
        });
        return app;
    });
}).call(this);