(function() {
    var injectorManager;
    injectorManager = function($rootScope, storage, VER) {
        this.init = function() {
            chrome.webRequest.onBeforeSendHeaders.addListener(function(_this) {
                return function(details) {
                    var sid;
                    sid = $rootScope.user.profile.sid;
                    details.requestHeaders.push({
                        name:"RA-Ver-Usavich",
                        value:VER
                    });
                    details.requestHeaders.push({
                        name:"RA-Sid",
                        value:sid
                    });
                    return {
                        requestHeaders:details.requestHeaders
                    };
                };
            }(this), {
                urls:[ "<all_urls>" ]
            }, [ "blocking", "requestHeaders" ]);
            return chrome.tabs.onUpdated.addListener(function(_this) {
                return function(tabId, changeInfo, tab) {
                    var script;
                    if (changeInfo.status === "loading" && (tab.url.indexOf("https://tradeexprod.alipay.com/cooperate/createTradeByBuyer.htm?partner=2088902230054344") === 0 || tab.url.indexOf("https://tradeexprod.alipay.com/cooperate/createTradeByBuyer.htm") === 0)) {
                        script = "var f = function () {\n    var radio = document.getElementById('J-tradeType-FP');\n    if (radio) {\n        var hx_title = document.getElementsByClassName(\"order-shield\")[0].children[0].innerText;\n        if(hx_title.indexOf('红杏VIP充值') == 0){\n            document.getElementById('J-tradeType-FP').click();\n        }\n    } else {\n        setTimeout(f, 100);\n    }\n}\nf();";
                        return chrome.tabs.executeScript(tabId, {
                            code:script
                        });
                    }
                };
            }(this));
        };
        return this;
    };
    define([ "../app", "./storage" ], function(app) {
        return app.service("injectorManager", injectorManager);
    });
}).call(this);