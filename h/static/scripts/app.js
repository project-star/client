'use strict';

var queryString = require('query-string');

require('./polyfills');

var raven;

// Initialize Raven. This is required at the top of this file
// so that it happens early in the app's startup flow
var configParam = queryString.parse(window.location.search).config || 'null';
var settings = require('./settings')(document);
Object.assign(settings, JSON.parse(configParam));
if (settings.raven) {
  raven = require('./raven');
  raven.init(settings.raven);
}

// Disable Angular features that are not compatible with CSP.
//
// See https://docs.angularjs.org/api/ng/directive/ngCsp
//
// The `ng-csp` attribute must be set on some HTML element in the document
// _before_ Angular is require'd for the first time.
document.body.setAttribute('ng-csp', '');

var angular = require('angular');

// autofill-event relies on the existence of window.angular so
// it must be require'd after angular is first require'd
require('autofill-event');

// Setup Angular integration for Raven
if (settings.raven) {
  raven.angularModule(angular);
} else {
  angular.module('ngRaven', []);
}

// Fetch external state that the app needs before it can run. This includes the
// authenticated user state, the API endpoint URLs and WebSocket connection.
var resolve = {
  // @ngInject
  sessionState: function (session) {
    return session.load();
  },
};

// @ngInject
function configureLocation($locationProvider) {
  // Use HTML5 history
  return $locationProvider.html5Mode(true);
}

// @ngInject
var VIEWER_TEMPLATE = require('../../templates/client/viewer.html');
var RENOTED_VIEWER_TEMPLATE = require('../../templates/client/renotedviewer.html');
var SIDE_VIEWER_TEMPLATE = require('../../templates/client/sideviewer.html');
function configureRoutes($routeProvider) {
  $routeProvider.when('/a/:id',
    {
      controller: 'AnnotationViewerController',
      template: VIEWER_TEMPLATE,
      reloadOnSearch: false,
      resolve: resolve,
    });
    $routeProvider.when('/u/:id',
    {
      controller: 'RenotedAnnotationViewerController',
      template: RENOTED_VIEWER_TEMPLATE,
      reloadOnSearch: false,
      resolve: resolve,
    });
  $routeProvider.when('/viewer',
    {
      controller: 'WidgetController',
      template: SIDE_VIEWER_TEMPLATE,
      reloadOnSearch: false,
      resolve: resolve,
    });
  $routeProvider.when('/stream',
    {
      controller: 'StreamController',
      template: RENOTED_VIEWER_TEMPLATE,
      reloadOnSearch: false,
      resolve: resolve,
    });
  $routeProvider.when('/showannotation',
    {
      controller: 'RenotedAnnotationController',
      template: VIEWER_TEMPLATE,
      reloadOnSearch: false,
      resolve: resolve,
    });
  return $routeProvider.otherwise({
    redirectTo: '/viewer',
  });
}

// @ngInject
function configureHttp($httpProvider, jwtInterceptorProvider) {
  // Use the Pyramid XSRF header name
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRF-Token';
  // Setup JWT tokens for API requests
  $httpProvider.interceptors.push('jwtInterceptor');
  jwtInterceptorProvider.tokenGetter = require('./auth').tokenGetter;
}

// @ngInject
function setupHttp($http, streamer) {
  $http.defaults.headers.common['X-Client-Id'] = streamer.clientId;
}

function processAppOpts() {
  if (settings.liveReloadServer) {
    require('./live-reload-client').connect(settings.liveReloadServer);
  }
}

module.exports = angular.module('h', [
  // Angular addons which export the Angular module name
  // via module.exports
  require('angular-jwt'),
  require('angular-resource'),
  require('angular-route'),
  require('angular-sanitize'),
  require('angular-toastr'),

  // Angular addons which do not export the Angular module
  // name via module.exports
  ['angulartics', require('angulartics')][0],
  ['angulartics.google.analytics', require('angulartics/src/angulartics-ga')][0],
  ['ngTagsInput', require('ng-tags-input')][0],
  ['ui.bootstrap', require('./vendor/ui-bootstrap-custom-tpls-0.13.4')][0],

  // Local addons
  'ngRaven',
])

  .controller('AnnotationUIController', require('./annotation-ui-controller'))
  .controller('AnnotationViewerController', require('./annotation-viewer-controller'))
  .controller('RenotedAnnotationViewerController', require('./renotedannotation-viewer-controller'))
  .controller('StreamController', require('./stream-controller'))
  .controller('RenotedAnnotationController', require('./renotedannotation-controller'))
  .controller('WidgetController', require('./widget-controller'))
  .controller("YouTubeCtrl", function($scope) {
    //initial settings
    $scope.yt = {
      width: 600, 
      height: 480, 
      videoid: "v=kDiS1Tg6Ldw",
    };

  })

  // The root component for the application
  .directive('renotedApp', require('./directive/app'))

  // UI components and helpers
  .directive('annotation', require('./directive/annotation').directive)
  .directive('url', require('./directive/url').directive)
  .directive('renotedannotation', require('./directive/renotedannotation').directive)
  .directive('annotationShareDialog', require('./directive/annotation-share-dialog'))
  .directive('annotationThread', require('./directive/annotation-thread'))
  .directive('videoThread', require('./directive/video-thread'))
  .directive('renotedannotationThread', require('./directive/renotedannotation-thread'))
  .directive('dropdownMenuBtn', require('./directive/dropdown-menu-btn'))
  .directive('excerpt', require('./directive/excerpt').directive)
  .directive('formInput', require('./directive/form-input'))
  .directive('formValidate', require('./directive/form-validate'))
  .directive('groupList', require('./directive/group-list').directive)
  .directive('helpLink', require('./directive/help-link'))
  .directive('helpPanel', require('./directive/help-panel'))
  .directive('hAutofocus', require('./directive/h-autofocus'))
  .directive('hOnTouch', require('./directive/h-on-touch'))
  .directive('hTooltip', require('./directive/h-tooltip'))
  .directive('loggedoutMessage', require('./directive/loggedout-message'))
  .directive('loginControl', require('./directive/login-control'))
  .directive('loginForm', require('./directive/login-form').directive)
  .directive('markdown', require('./directive/markdown'))
  .directive('vidmarkdown', require('./directive/vidmarkdown'))
  .directive('publishAnnotationBtn', require('./directive/publish-annotation-btn'))
  .directive('searchStatusBar', require('./directive/search-status-bar'))
  .directive('shareDialog', require('./directive/share-dialog'))
  .directive('sidebarTutorial', require('./directive/sidebar-tutorial').directive)
  .directive('searchInput', require('./directive/search-input'))
  .directive('selectionTabs', require('./directive/selection-tabs'))
  .directive('shareSelectionTabs', require('./directive/share-selection-tabs'))
  .directive('sortDropdown', require('./directive/sort-dropdown'))
  .directive('spinner', require('./directive/spinner'))
  .directive('statusButton', require('./directive/status-button'))
  .directive('svgIcon', require('./directive/svg-icon'))
  .directive('tagEditor', require('./directive/tag-editor'))
  .directive('videotimeEditor', require('./directive/videotime-editor'))
  .directive('threadList', require('./directive/thread-list'))
  .directive('renotedthreadList', require('./directive/renotedthread-list'))
  .directive('timestamp', require('./directive/timestamp'))
  .directive('topBar', require('./directive/top-bar'))
  .directive('windowScroll', require('./directive/window-scroll'))
  .directive('videoFrame',['vidService', function(vidService) {
    return {
      restrict: 'E',
      scope: {
        trackUrl : '=',
        playerId : '=',
      },
      template: require('../../templates/client/video_frame.html'),
    };
  }
  ])
  .directive('scWidget',['scService', function(scService) {
    return {
      restrict: 'E',
      scope: {
        trackUrl : '=',
        playerId : '=',
      },
      template: require('../../templates/client/sc_widget.html'),      
    };
  }
  ])
  .directive('youtube', function($window) {
  return {
    restrict: "E",

    scope: {
      height: "@",
      width: "@",
      videoid: "@"
    },

    template: '<div></div>',

    link: function(scope, element) {
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      var player;

      $window.onYouTubeIframeAPIReady = function() {

        player = new YT.Player(element.children()[0], {
          playerVars: {
            autoplay: 0,
            html5: 1,
            theme: "light",
            modesbranding: 0,
            color: "white",
            iv_load_policy: 3,
            showinfo: 1,
            controls: 1
          },

          height: scope.height,
          width: scope.width,
          videoId: scope.videoid, 
        });
      }

      scope.$watch('videoid', function(newValue, oldValue) {
        if (newValue == oldValue) {
          return;
        }

        player.cueVideoById(scope.videoid);

      }); 

      scope.$watch('height + width', function(newValue, oldValue) {
        if (newValue == oldValue) {
          return;
        }

        player.setSize(scope.width, scope.height);

      });
    }  
  };
})


  .service('annotationMapper', require('./annotation-mapper'))
  .service('annotationUI', require('./annotation-ui'))
  .service('auth', require('./auth').service)
  .service('bridge', require('./bridge'))
  .service('drafts', require('./drafts'))
  .service('urldrafts',require('./urldrafts'))
  .service('features', require('./features'))
  .service('flash', require('./flash'))
  .service('formRespond', require('./form-respond'))
  .service('frameSync', require('./frame-sync').default)
  .service('groups', require('./groups'))
  .service('host', require('./host'))
  .service('localStorage', require('./local-storage'))
  .service('permissions', require('./permissions'))
  .service('queryParser', require('./query-parser'))
  .service('rootThread', require('./root-thread'))
  .service('searchFilter', require('./search-filter'))
  .service('serviceUrl', require('./service-url'))
  .service('session', require('./session'))
  .service('streamer', require('./streamer'))
  .service('datacollect', require('./datacollect'))
  .service('streamFilter', require('./stream-filter'))
  .service('tags', require('./tags'))
  .service('unicode', require('./unicode'))
  .service('viewFilter', require('./view-filter'))
  .provider('scService', function() {
    //constructor function of the Provider
    var apiUrl = "https://w.soundcloud.com/player/api.js";
    //$get gets automatically executed by AngularJS
    
    this.$get = function() {
      
      var tag = document.createElement('script');
      tag.src = apiUrl;
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
    };
  })
  .provider('youtubeService', function() {
    //constructor function of the Provider
    var apiUrl = "https://www.youtube.com/iframe_api";
    //$get gets automatically executed by AngularJS

    this.$get = function() {

      var tag = document.createElement('script');
      tag.src = apiUrl;
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    };
  })
  .provider('vidService', function() {
    //constructor function of the Provider
    var apiUrl = "https://player.vimeo.com/api/player.js";
    //$get gets automatically executed by AngularJS

    this.$get = function() {

      var tag = document.createElement('script');
      tag.async = true;
      tag.src = apiUrl;
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    };
  })  
  .factory('store', require('./store'))

  .value('AnnotationUISync', require('./annotation-ui-sync'))
  .value('Discovery', require('./discovery'))
  .value('ExcerptOverflowMonitor', require('./directive/excerpt-overflow-monitor'))
  .value('VirtualThreadList', require('./virtual-thread-list'))
  .value('raven', require('./raven'))
  .value('settings', settings)
  .value('time', require('./time'))
  .value('urlEncodeFilter', require('./filter/url').encode)
  .config(function($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist(['**']);
   })
  .config(configureHttp)
  .config(configureLocation)
  .config(configureRoutes)
  .config(['scServiceProvider', function(scServiceProvider) {
    //TODO: Set the SC Widget API here

  }])
  
  .run(setupHttp);

processAppOpts();

var appEl = document.querySelector('renoted-app');
angular.bootstrap(appEl, ['h'], {strictDi: true});
