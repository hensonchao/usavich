(function() {
    var formState;
    formState = function(safeApply, $log) {
        return {
            restrict:"A",
            link:function(scope, elem, attrs) {
                var divs, field, fieldName, form, hasError, hasSuccess, helpBlock, i, input, _i, _ref, _ref1;
                _ref = attrs.formState.split("."), form = _ref[0], fieldName = _ref[1];
                field = function() {
                    return scope[form][fieldName];
                };
                helpBlock = null;
                divs = elem.find("div");
                for (i = _i = 0, _ref1 = divs.length; 0 <= _ref1 ? _i <= _ref1 :_i >= _ref1; i = 0 <= _ref1 ? ++_i :--_i) {
                    if (divs.eq(i).hasClass("errors")) {
                        helpBlock = divs.eq(i);
                        break;
                    }
                }
                input = elem.find("input");
                input.on("focus", function() {
                    field().$stateVisible = false;
                    return safeApply.apply(scope);
                }).on("keydown", function() {
                    field().$stateVisible = false;
                    return safeApply.apply(scope);
                }).on("blur", function() {
                    if (field().$dirty) {
                        field().$stateVisible = true;
                        return safeApply.apply(scope);
                    }
                });
                hasError = function(scope) {
                    return scope[form][fieldName].$stateVisible && scope[form][fieldName].$invalid;
                };
                hasSuccess = function(scope) {
                    var _ref2;
                    return scope[form][fieldName].$stateVisible && ((_ref2 = field()) != null ? _ref2.$valid :void 0);
                };
                scope.$watch(hasError, function(newValue, oldValue) {
                    if (newValue) {
                        elem.addClass("has-error");
                        return helpBlock.removeClass("invisible");
                    } else {
                        elem.removeClass("has-error");
                        return helpBlock.addClass("invisible");
                    }
                });
                return scope.$watch(hasSuccess, function(newValue, oldValue) {
                    if (newValue) {
                        return elem.addClass("has-success");
                    } else {
                        return elem.removeClass("has-success");
                    }
                });
            }
        };
    };
    define([ "../app", "../services/safeApply" ], function(app) {
        return app.directive("formState", formState);
    });
}).call(this);