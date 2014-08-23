(function() {
    var domainUtils, __indexOf = [].indexOf || function(item) {
        for (var i = 0, l = this.length; i < l; i++) {
            if (i in this && this[i] === item) return i;
        }
        return -1;
    };
    domainUtils = function(validate) {
        var a, filterIllegalChar;
        this.dnsDomainIs = function(domain, base) {
            var rIndex, rightRemains;
            if (domain === base) {
                return true;
            } else {
                rIndex = domain.lastIndexOf(base);
                if (rIndex <= 0) {
                    return false;
                } else {
                    rightRemains = domain.length - (rIndex + base.length);
                    if (domain[rIndex - 1] === "." && rightRemains <= 0) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        };
        a = document.createElement("a");
        this.parseUri = function(url) {
            var query, queryStr;
            if (!url) {
                return {};
            }
            a.href = url;
            queryStr = a.search;
            query = {};
            if (queryStr) {
                queryStr = queryStr.slice(1);
                queryStr.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
                    if ($0) {
                        return query[$1] = $2;
                    }
                });
            }
            return {
                protocol: a.protocol.slice(0, -1),
                user: a.username,
                password: a.password,
                host: a.hostname,
                port: a.port,
                path: a.pathname,
                hash: a.hash,
                query: query
            };
        };
        filterIllegalChar = function(domain) {
            return domain.replace(/[^0-9a-zA-Z\-\.]/gi, "");
        };
        this.trimDomain = function(domain) {
            domain = filterIllegalChar(domain);
            if (!domain) {
                return "";
            }
            return domain.trim();
        };
        this.topDomain = function(_this) {
            return function(domain) {
                var i, ltds, part, parts, trimedParts, _i;
                domain = filterIllegalChar(domain);
                if (!domain) {
                    return domain;
                }
                if (!validate.domain(domain)) {
                    return domain;
                }
                ltds = [ "ac", "ad", "ae", "af", "ag", "ai", "al", "am", "an", "ao", "aq", "ar", "as", "at", "au", "aw", "ax", "az", "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bm", "bn", "bo", "br", "bs", "bt", "bu", "bv", "bw", "by", "bz", "ca", "cc", "cd", "cf", "cg", "ch", "ci", "ck", "cl", "cm", "cn", "co", "cr", "cs", "cu", "cv", "cx", "cy", "cz", "dd", "de", "dj", "dk", "dm", "do", "dz", "ec", "ee", "eg", "eh", "er", "es", "et", "eu", "fi", "fj", "fk", "fm", "fo", "fr", "ga", "gb", "gd", "ge", "gf", "gg", "gh", "gi", "gl", "gm", "gn", "gp", "gq", "gr", "gs", "gt", "gu", "gw", "gy", "hk", "hm", "hn", "hr", "ht", "hu", "id", "ie", "il", "im", "in", "io", "iq", "ir", "is", "it", "je", "jm", "jo", "jp", "ke", "kg", "kh", "ki", "km", "kn", "kp", "kr", "kw", "ky", "kz", "la", "lb", "lc", "li", "lk", "lr", "ls", "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mg", "mh", "mk", "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw", "mx", "my", "mz", "na", "nc", "ne", "nf", "ng", "ni", "nl", "no", "np", "nr", "nu", "nz", "om", "pa", "pe", "pf", "pg", "ph", "pk", "pl", "pm", "pn", "pr", "ps", "pt", "pw", "py", "qa", "re", "ro", "ru", "rw", "sa", "sb", "sc", "sd", "se", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sr", "st", "su", "sv", "sy", "sz", "tc", "td", "tf", "tg", "th", "tj", "tk", "tl", "tm", "tn", "to", "tp", "tr", "tt", "tv", "tw", "tz", "ua", "ug", "uk", "um", "us", "uy", "uz", "va", "vc", "ve", "vg", "vi", "vn", "vu", "wf", "ws", "ye", "yt", "yu", "za", "zm", "zr", "zw", "com", "net", "org", "mil", "gov", "edu", "nato", "info", "int", "name", "biz", "mobi", "museum", "pro", "tel", "asia", "xxx" ];
                parts = domain.split(".");
                trimedParts = [];
                for (i = _i = parts.length - 1; _i >= 0; i = _i += -1) {
                    part = parts[i];
                    if (__indexOf.call(ltds, part) >= 0 || i === parts.length - 1) {
                        trimedParts.unshift(part);
                    } else {
                        trimedParts.unshift(part);
                        break;
                    }
                }
                return trimedParts.join(".");
            };
        }(this);
        return this;
    };
    define([ "../app", "./validate" ], function(app) {
        return app.service("domainUtils", domainUtils);
    });
}).call(this);