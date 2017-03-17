'use strict';

var scrollIntoView = require('scroll-into-view');

var events = require('./events');
var parseAccountID = require('./filter/persona').parseAccountID;
var scopeTimeout = require('./util/scope-timeout');
var uiConstants = require('./ui-constants');

function authStateFromUserID(userid) {
  if (userid) {
    var parsed = parseAccountID(userid);
    return {
      status: 'logged-in',
      userid: userid,
      username: parsed.username,
      provider: parsed.provider,
    };
  } else {
    return {status: 'logged-out'};
  }
}

// @ngInject
module.exports = function AppController(
  $controller, $document, $location, $rootScope, $route, $scope,$routeParams,
  $window, annotationUI, auth, drafts, features, frameSync, groups,urlUI,
  serviceUrl, session, settings, streamer,datacollect
) {
  $controller('AnnotationUIController', {$scope: $scope});
  $controller('UrlUIController', {$scope: $scope});
  // This stores information about the current user's authentication status.
  // When the controller instantiates we do not yet know if the user is
  // logged-in or not, so it has an initial status of 'unknown'. This can be
  // used by templates to show an intermediate or loading state.
  $scope.auth = {status: 'unknown'};
  // Allow all child scopes to look up feature flags as:
  //
  //     if ($scope.feature('foo')) { ... }
  $scope.feature = features.flagEnabled;

  // Allow all child scopes access to the session
  $scope.session = session;

  // App dialogs
  $scope.accountDialog = {visible: false};
  $scope.shareDialog = {visible: false};
  $scope.helpPanel = {visible: false};

  //Intro variable
  $scope.showIntro = function () {
    return urlUI.getState().showTutorials
   };
  $scope.totalIntroItems = 5;
  $scope.currentIntroItem = 1; //Skip condition

    $scope.dcrIntroCount = function() {
    if($scope.currentIntroItem > 1)
      $scope.currentIntroItem = $scope.currentIntroItem - 1;

      //Do NOTHING
  };

  $scope.incrIntroCount = function() {
    if($scope.currentIntroItem < $scope.totalIntroItems)
      $scope.currentIntroItem = $scope.currentIntroItem + 1;
    else {
      $scope.currentIntroItem = 1; //Skip condition
      urlUI.setShowTutorials(false); //Also set intro completed in user profile (backend)
    }
  };

  $scope.skipIntro = function() {
    $scope.currentIntroItem = 1;
    urlUI.setShowTutorials(false);
  };

   $scope.setShowTutorials = function() {
    urlUI.setShowTutorials(true);
  };

  //Variable to set Stream page
 // $scope.isSharedStream = false;
  if ($location.path() == "/renote"){
    $scope.isSharedStream = false;
  }
  else
    $scope.isSharedStream = true;
  // Check to see if we're in the sidebar, or on a standalone page such as
  // the stream page or an individual annotation page.
  $scope.isSidebar = $window.top !== $window;
  if ($scope.isSidebar) {
    frameSync.connect();
  }
  $scope.selectedUrlFilterKey = function() {
    return urlUI.getState().selectedUrlFilterKey;
  }

  $scope.urlLoading = function() {
    return urlUI.getState().urlLoading;
  }
  $scope.serviceUrl = serviceUrl;

  $scope.sortKey = function () {
    return urlUI.getState().sortKey;
  };

  $scope.sortKeysAvailable = function () {
    return urlUI.getState().sortKeysAvailable;
  };

  // $scope.names = ["Update Time :Descending", "Update Time :Ascending", "Relevance", "Create Time :Ascending", "Create Time: Descending"];

  // $scope.selectedSort=urlUI.getState().sortKey;
  // //$scope.initialLoad=true;  
  // $scope.sortBy = function() {
  //   urlUI.setSortKey($scope.selectedSort);
  //   return false;
  // }


  $scope.setSortKey = urlUI.setSortKey;
  $scope.setUrlFilterKeyAll = function(value) {
      urlUI.setUrlFilterKey('all')
  }
  $scope.setUrlFilterKeyText = function(value) {
      urlUI.setUrlFilterKey('text')
  }

 $scope.setUrlFilterKeyVideo = function(value) {
      urlUI.setUrlFilterKey('video')
  }

 $scope.setUrlFilterKeyAudio = function() {
      urlUI.setUrlFilterKey('audio')
  }


  // Reload the view when the user switches accounts
  $scope.$on(events.USER_CHANGED, function (event, data) {
    $scope.auth = authStateFromUserID(data.userid);
    $scope.accountDialog.visible = false;
    urlUI.setShowTutorials(data.showTutorial)
    if (!data || !data.initialLoad) {
      $route.reload();
    }
  });

  session.load().then(function (state) {
    // When the authentication status of the user is known,
    // update the auth info in the top bar and show the login form
    // after first install of the extension.
    $scope.auth = authStateFromUserID(state.userid);
    urlUI.setShowTutorials(state.showTutorial)
    if (!state.userid && settings.openLoginForm) {
      $scope.login();
    }
  });

  /** Scroll to the view to the element matching the given selector */
  function scrollToView(selector) {
    // Add a timeout so that if the element has just been shown (eg. via ngIf)
    // it is added to the DOM before we try to locate and scroll to it.
    scopeTimeout($scope, function () {
      scrollIntoView($document[0].querySelector(selector));
    }, 0);
  }

  // Start the login flow. This will present the user with the login dialog.
  $scope.login = function () {
    $scope.accountDialog.visible = true;
    scrollToView('login-form');
  };

  // Display the dialog for sharing the current page
  $scope.share = function () {
    $scope.shareDialog.visible = true;
    scrollToView('share-dialog');
  };

  $scope.leftNavVisible = true;

  $scope.filterByStack = function(stackName) {
    if (!urlUI.getState().urlLoading){
    urlUI.setUrlStackKey(stackName)
   }
  };

  $scope.toggleLeftNav = function() {

    if($scope.leftNavVisible)
      $scope.leftNavVisible = false;
    else
      $scope.leftNavVisible = true;
    datacollect.connectionsend("toggleLeftNav")
    return $scope.leftNavVisible;
  };

  $scope.toggleSharedStream = function (flag) {
    datacollect.connectionsend("SharedStreamToggled")
//    if (flag) {
//       $rootScope.$emit(events.SHARING_CLEARED)
//      }
    $scope.isSharedStream = flag;
    urlUI.setUrlFilterKey('all')
    urlUI.setUrlStackKey('serversideaddedstack')
  };


  // Prompt to discard any unsaved drafts.
  var promptToLogout = function () {
    // TODO - Replace this with a UI which doesn't look terrible.
    var text = '';
    if (drafts.count() === 1) {
      text = 'You have an unsaved annotation.\n' +
        'Do you really want to discard this draft?';
    } else if (drafts.count() > 1) {
      text = 'You have ' + drafts.count() + ' unsaved annotations.\n' +
        'Do you really want to discard these drafts?';
    }
    return (drafts.count() === 0 || $window.confirm(text));
  };

  // Log the user out.
  $scope.logout = function () {
    if (!promptToLogout()) {
      return;
    }
    drafts.unsaved().forEach(function (draft) {
      $rootScope.$emit(events.ANNOTATION_DELETED, draft);
    });
    drafts.discard();
    $scope.accountDialog.visible = false;
    auth.logout();
  };

  $scope.clearSelection = function () {
    var selectedTab = annotationUI.getState().selectedTab;
    if (!annotationUI.getState().selectedTab || annotationUI.getState().selectedTab === uiConstants.TAB_ORPHANS) {
      selectedTab = uiConstants.TAB_ANNOTATIONS;
    }

    annotationUI.clearSelectedAnnotations();
    annotationUI.selectTab(selectedTab);
  };
  $scope.clearSharing = function () {
       $rootScope.$emit(events.SHARING_CLEARED)
  };

  $scope.ifSharing = function () {
       return datacollect.hasSharingUpdates
  };

  $scope.numberShared = function(){
       return datacollect.sharedUpdates.sharecount
  };

  $scope.search = {
    query: function () {
      return annotationUI.getState().filterQuery;
    },
    update: function (query) {
      annotationUI.setFilterQuery(query);
    },
  };

  $scope.countPendingUpdates = streamer.countPendingUpdates;
  $scope.applyPendingUpdates = streamer.applyPendingUpdates;
  $scope.hasSharingUpdates = datacollect.hasSharingUpdates;
  $scope.sharedUpdates = datacollect.sharedUpdates.sharecount;
};
