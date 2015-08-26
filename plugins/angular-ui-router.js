/*
 * Installation:
 *
 * Somewhere in your Angular app or module startup, call BOOMR.plugins.Angular.hook($rootScope).
 *
 * eg:
 * angular.module('app')
 *   .run(['$rootScope', function($rootScope) {
 *     var hadRouteChange = false;
 *     $rootScope.$on("$stateChangeStart", function() {
 *       hadRouteChange = true;
 *     });

 *     function hookAngularBoomerang() {
 *       if (window.BOOMR && BOOMR.version) {
 *         if (BOOMR.plugins && BOOMR.plugins.Angular) {
 *           BOOMR.plugins.AngularUIRouter.hook($rootScope, hadRouteChange);
 *         }
 *         return true;
 *       }
 *     }
 *
 *     if (!hookAngularBoomerang()) {
 *       if (document.addEventListener) {
 *         document.addEventListener("onBoomerangLoaded", hookAngularBoomerang);
 *       } else if (document.attachEvent) {
 *         document.attachEvent("onpropertychange", function(e) {
 *           e = e || window.event;
 *           if (e && e.propertyName === "onBoomerangLoaded") {
 *             hookAngularBoomerang();
 *           }
 *         });
 *       }
 *   }]);
 */
(function() {
  var hooked = false,
	  enabled = true,
	  hadMissedRouteChange = false;

  if (BOOMR.plugins.AngularUIRouter || typeof BOOMR.plugins.SPA === "undefined") {
	return;
  }

  // register as a SPA plugin
  BOOMR.plugins.SPA.register("AngularUIRouter");

  /**
   * Bootstraps the AngularUIRouter plugin with the specified $rootScope of the host
   * Angular app.
   *
   * @param $rootScope Host AngularJS app's $rootScope
   *
   * @return {boolean} True on success
   */
  function bootstrap($rootScope) {
	if (typeof $rootScope === "undefined") {
	  return false;
	}

	// We need the AutoXHR and SPA plugins to operate
	if (!BOOMR.plugins.AutoXHR ||
	  !BOOMR.plugins.SPA) {
	  return false;
	}

	/**
	 * Debug logging for this $rootScope's ID
	 *
	 * @param {string} msg Message
	 */
	function log(msg) {
	  BOOMR.debug($rootScope.$id + ": " + msg, "angular-ui-router");
	}

	log("Startup");

	// Listen for Angular UI Router's $stateChangeStart, which is fired whenever a
	// route changes (i.e. a soft navigation, which is associated with the
	// URL in the address bar changing)
	$rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
	  if (!enabled) {
		hadMissedRouteChange = true;
		return;
	  }

	  log("$stateChangeStart: " + (currRoute ? currRoute.templateUrl : ""));

	  BOOMR.plugins.SPA.route_change();
	});

	// Listen for $stateChangeSuccess to know the new URL when the route changes
	$rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams){
	  var lastLocation;

	  lastLocation = window.location.pathname + window.location.search;

	  if (!enabled) {
		return;
	  }

	  log("$stateChangeSuccess: " + lastLocation);

	  BOOMR.plugins.SPA.last_location(lastLocation);
	});

	return true;
  }

  //
  // Exports
  //
  BOOMR.plugins.AngularUIRouter = {
	is_complete: function() {
	  return true;
	},
	hook: function($rootScope, hadRouteChange) {
	  if (hooked) {
		return this;
	  }

	  if (bootstrap($rootScope)) {
		BOOMR.plugins.SPA.hook(hadRouteChange);

		hooked = true;
	  }

	  return this;
	},
	disable: function() {
	  enabled = false;
	  return this;
	},
	enable: function() {
	  enabled = true;

	  if (hooked && hadMissedRouteChange) {
		hadMissedRouteChange = false;
		BOOMR.plugins.SPA.route_change();
	  }

	  return this;
	}
  };
}(BOOMR.window));
