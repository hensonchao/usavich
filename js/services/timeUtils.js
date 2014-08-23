(function() {
    var timeUtils;
    timeUtils = function($timeout) {
        //返回时间戳秒数
		this.time = function() {
            return parseInt(new Date().getTime() / 1e3);
        };
		//返回时间毫秒数
        this.milliTime = function() {
            return new Date().getTime();
        };
        this.throttle = function(func, wait) {
            var args, context, later, previous, result, timeout;
            context = null;
            args = null;
            result = null;
            timeout = null;
            previous = 0;
            later = function() {
                previous = new Date();
                timeout = null;
                result = func.apply(context, args);
                return context = args = null;
            };
            return function() {
                var now, remaining;
                context = this;
                args = arguments;
                now = new Date();
                remaining = previous + wait - now;
                if (remaining <= 0) {
                    if (timeout) {
                        $timeout.cacel(timeout);
                    }
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args);
                    context = args = null;
                } else if (!timeout) {
                    timeout = $timeout(later, remaining);
                }
                return result;
            };
        };
        this.debounce = function(func, wait) {
            var args, context, later, previous, result, timeout;
            timeout = null;
            args = null;
            context = null;
            previous = 0;
            result = null;
            later = function() {
                previous = new Date();
                timeout = null;
                result = func.apply(context, args);
                return context = args = null;
            };
            return function() {
                context = this;
                args = arguments;
                if (!timeout) {
                    timeout = $timeout(later, wait);
                } else {
                    $timeout.cancel(timeout);
                    timeout = $timeout(later, wait);
                }
                return result;
            };
        };
        return this;
    };
    define([ "../app" ], function(app) {
        return app.service("timeUtils", timeUtils);
    });
}).call(this);