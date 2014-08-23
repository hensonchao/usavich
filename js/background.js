(function() {
	var initBackground, libs;
	initBackground = function($rootScope, $log, server, proxyManager, domainManager, userManager, tabsTracker, storage, performanceTracker, conflictDetector, badgeManager, teleScope, injectorManager, pageManager, track, notificationManager, upgradeManager, ROLES, VER) {
		var ver;
		server.init();
		userManager.init();
		tabsTracker.init();
		injectorManager.init();
		performanceTracker.init();
		conflictDetector.init();
		domainManager.init();
		proxyManager.init();
		badgeManager.init();
		track.init();
		notificationManager.init();
		upgradeManager.init();
		ver = VER;
		if (!storage.get('ver')) {
			domainManager.initFromDefault();
			track.event('extension', 'install', ver);
		} else if (ver !== storage.get('ver')) {
			track.event('extension', 'update', "" + (storage.get('ver')) + "->" + ver);
		}
		storage.set('ver', ver);
		if ($rootScope.user.role === ROLES.GUEST) {
			return pageManager.openLogin('force-login');
		}
	};
	libs = ['angular', 'services/storage', 'services/server', 'services/teleScope', 'services/userManager', 'services/domainManager', 'services/proxyManager', 'services/tabsTracker', 'services/injectorManager', 'services/performanceTracker', 'services/conflictDetector', 'services/badgeManager', 'services/notificationManager', 'services/upgradeManager', 'libs/analytics', 'services/track'];
	require(['config'],
	function() {
		return requireWithRetry(libs, function(angular) {
			var background;
			background = angular.module('background', ['app']);
			background.run(initBackground);
			return angular.element(document).ready(function() {
				return angular.bootstrap(document, ['background']);
			});
		});
	});
}).call(this);