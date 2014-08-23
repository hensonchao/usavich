(function() {
    define([ "../app", "md5" ], function(app, md5) {
        var generate;
        generate = function() {
            this.uuid = function() {
                var chars, i, r, rnd, uuid, _i;
                chars = "0123456789abcdef".split("");
                uuid = [];
                rnd = Math.random;
                uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
                uuid[14] = "4";
                for (i = _i = 0; _i <= 35; i = ++_i) {
                    if (!uuid[i]) {
                        r = 0 | rnd() * 16;
                        uuid[i] = chars[i === 19 ? r & 3 | 8 :r & 15];
                    }
                }
                return uuid.join("");
            };
            this.randomId = function(length) {
                var chars, i;
                chars = "01234567890abcdefghijklmnopqrstuvwxyz";
                return function() {
                    var _i, _results;
                    _results = [];
                    for (i = _i = 1; 1 <= length ? _i <= length :_i >= length; i = 1 <= length ? ++_i :--_i) {
                        _results.push(chars[Math.floor(Math.random() * chars.length)]);
                    }
                    return _results;
                }().join("");
            };
            this.md5 = function(str) {
                return md5(str);
            };
            return this;
        };
        return app.service("generate", generate);
    });
}).call(this);