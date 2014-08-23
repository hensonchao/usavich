/**
 * Log Unobtrusive Extension v0.0.7
 *
 * Used within AngularJS to enhance functionality within the AngularJS $log service.
 *
 * @original-author  Thomas Burleson
 * @contributor Layton Whiteley
 * @contributor A confused individual <ferronrsmith@gmail.com>
 * @website http://www.theSolutionOptimist.com
 * (c) 2013 https://github.com/lwhiteley/AngularLogExtender
 * License: MIT
 *
 * Modifications made by @contributor Layton Whiteley:
 * - Modified to be a full stand-alone Angular Application for reuse
 * - Has global and feature level activation/disabling for $log
 * - Created and tested with AngularJS v.1.2.3
 */
angular.module("log.ex.uo",[]).provider("logEx",["$provide",function(n){var r=angular.injector(["ng"]),e=r.get("$filter"),o=!1,t=!1,i=!1,u=null,a=navigator.userAgent,l=["log","info","warn","debug","error","getInstance"],g=["chrome","firefox"],c=!0,s={log:"color: green;",info:"color: blue",warn:"color: #CC9933;",debug:"color: brown;",error:"color: red;"},f=l,d=function(n){return"string"===h(n)?n.replace(/^\s*/,"").replace(/\s*$/,""):""},h=function(n){return Object.prototype.toString.call(n).replace(/(\[|object|\s|\])/g,"").toLowerCase()},v=function(n){return"boolean"===h(n)},L=function(n){return"string"===h(n)&&""!==d(n)},p=function(n,r){return"string"===h(n)&&"string"===h(r)&&-1!=r.toLowerCase().indexOf(n.toLowerCase())?!0:!1},b=function(n,r){return v(n)&&n&&2==r.length},y=function(n,r,e){var o="string"!==h(n)&&"object"!==h(r),t="string"!==h(n)||"object"!==h(r);return o||t?Array.prototype.slice.call(arguments):(e="regexp"===h(e)?e:/\{([^\{\}]*)\}/g,n.replace(e,function(n,e){var o=e.split("."),t=r;try{for(var i in o)t=t[o[i]]}catch(u){t=n}return"string"==typeof t||"number"==typeof t?t:n}))},E=function(){for(var n=0;g.length>n;n++)if(p(g[n],a))return!0;return!1},x=E(),C=function(n){return 1==n.length&&"string"===h(n[0])},D=function(n){return p("color",n)||p("background",n)||p("border",n)},G=function(n){return"string"===h(n)&&p(":",n)&&d(n).length>6&&D(n)},I=function(n,r,e){e="string"===h(e)?e:"";var o=x&&G(r)&&"string"===h(n),t=o?""+e+n:n;return o?["%c"+t,r]:[t]},O=function(n){var r=" >> ",o="MMM-dd-yyyy-h:mm:ssa",t=e("date")(new Date,o);return""+t+("string"!==h(n)?"":"::"+n)+r},w=function(n){var r="";return r=v(i)&&i||!v(t)||!t||!angular.isFunction(u)?O(n):u(n)};n.decorator("$log",["$delegate",function(n){var r=function(){var n=function(n){return v(n)},r=function(n){return n!==!1},e=function(n,r){return v(n)&&v(r)?r:!1},o=function(n,r,e,o,t){var i=L(o)?o:"this instance";!t&&r&&e?n.log(w()+"[OVERRIDE] LOGGING ENABLED - $log enabled for "+i):t&&r&&!e&&n.log(w()+"[OVERRIDE] LOGGING DISABLED - $log disabled for "+i)},t=function(n){var r={};return angular.isArray(n)&&(r={getInstance:angular.noop},angular.forEach(n,function(n){r[n]=angular.noop})),r},i=function(n,r,e,o){var i={},u=t(r);return angular.forEach(l,function(r){var t;if(angular.isDefined(o)){var a=[];angular.copy(o,a),a.unshift(n[r]),x&&c&&(a[5]=G(a[5])?a[5]:s[r]),t=e.apply(null,a)}else t=n[r];i[r]=angular.isUndefined(u[r])?angular.noop:t}),i},u=function(t){var u=function(n,r,o,t,i,u){var a=function(){var a=t?e(g,o):g;if(a){var l=Array.prototype.slice.call(arguments),c=w(r);if(b(i,l)){var s=y.apply(null,l);s="string"===h(s)?[s]:s,l=s}"string"===h(u)&&C(l)?l=I(l[0],u,c):l.unshift(c),n&&n.apply(null,l)}};return a.logs=[],a},a=i(t,f),l=function(e,t,l,c){v(e)?(t=e,e=null):e="string"===h(e)?d(e):null;var s=n(t);return t=r(t),o(a,s,t,e,g),i(a,f,u,[e,t,s,l,c])},g=!1;return angular.extend(t,i(t,f,u,[null,!1,!1,!1,null])),t.getInstance=l,t.enableLog=function(n){g=n},t.logEnabled=function(){return g},t},a=function(n){return i(n,f)};this.enhanceLogger=u,this.exposeSafeLog=a},e=new r;return e.enhanceLogger(n),n.enableLog(o),n.logEnabled()&&n.log("CONFIG: LOGGING ENABLED GLOBALLY"),e.exposeSafeLog(n)}]);var A=function(n){o=v(n)?n:!1},M=function(n){angular.isArray(n)&&(f=n)},m=function(n){angular.isFunction(n)&&(u=n,t=!0)},$=function(n){c=v(n)&&n?!1:!0},j=function(n,r){"string"===h(n)&&s.hasOwnProperty(n)&&G(r)&&(s[n]=r)},N=function(n){"object"===h(n)&&angular.forEach(n,function(n,r){j(r,n)})},P=function(n){v(n)&&(i=n)};this.$get=function(){return{name:"Log Unobtrusive Extension",version:"0.0.7",enableLogging:A,restrictLogMethods:M,overrideLogPrefix:m,disableDefaultColors:$,setLogMethodColor:j,overrideLogMethodColors:N,useDefaultLogPrefix:P}},this.enableLogging=A,this.overrideLogPrefix=m,this.restrictLogMethods=M,this.disableDefaultColors=$,this.setLogMethodColor=j,this.overrideLogMethodColors=N,this.useDefaultLogPrefix=P}]);