(function() {
    var random;
    random = {
        randint:function(a, b) {
            var _ref;
            _ref = [ a, b ].sort(), a = _ref[0], b = _ref[1];
            return a + parseInt(Math.random() * (b - a + 1));
        },
        choice:function(items) {
            if (!items || !items.length) {
                return null;
            }
            return items[parseInt(items.length * Math.random())];
        }
    };
    define([ "../app" ], function(app) {
        return app.factory("random", function() {
            return random;
        });
    });
}).call(this);