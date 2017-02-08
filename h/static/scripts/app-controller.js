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

function fetchSearch(store, query) {
  var urllistvalue={};
  
  console.log("+++++ in prefetch thread +++++")
  return store.urls(query).then(function (searchResult) {
    urllistvalue=searchResult;
    return urllistvalue
  });
}

// @ngInject
module.exports = function AppController(
  $controller, $document, $location, $rootScope, $route, $scope,
  $window, annotationUI, auth, drafts, features, frameSync, groups,
  serviceUrl, session, settings, streamer, searchFilter,store,datacollect
) {
  $controller('AnnotationUIController', {$scope: $scope});
  console.log(annotationUI.getState().selectedAnnotationMap)
  annotationUI.selectSharedTab('ownannotation')
  console.log(annotationUI.getState().selectedSharedTab)  
  $scope.mainTab = true;
  $scope.switchUpperTabs = function() {
      $scope.mainTab = !$scope.mainTab;
      if ($scope.mainTab){
          console.log($scope.mainTab)
//          annotationUI.selectTab(uiConstants.TAB_ANNOTATIONS);
          console.log(annotationUI.getState().selectedTab);
      }
  } 
  $scope.getMainTab = function(){
      return $scope.mainTab;
  }

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

  // Check to see if we're in the sidebar, or on a standalone page such as
  // the stream page or an individual annotation page.
  $scope.isSidebar = $window.top !== $window;
  if ($scope.isSidebar) {
    frameSync.connect();
  }

  $scope.serviceUrl = serviceUrl;
  
  $scope.sortKey = function () {
    return annotationUI.getState().sortKey;
  };

  $scope.sortKeysAvailable = function () {
    return annotationUI.getState().sortKeysAvailable;
  };

  $scope.setSortKey = annotationUI.setSortKey;

  // Reload the view when the user switches accounts
  $scope.$on(events.USER_CHANGED, function (event, data) {
    $scope.auth = authStateFromUserID(data.userid);
    $scope.accountDialog.visible = false;

    if (!data || !data.initialLoad) {
      $route.reload();
    }
  });

  session.load().then(function (state) {
    // When the authentication status of the user is known,
    // update the auth info in the top bar and show the login form
    // after first install of the extension.
    $scope.auth = authStateFromUserID(state.userid);

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
    $scope.mainTab = true;
//    $route.reload()
    $scope.sidebarquery=0;
    $scope.sidebarsearchresult=""
    $scope.displayedNumber = 5;
    var selectedTab = annotationUI.getState().selectedTab;
    console.log(selectedTab)
    if (!annotationUI.getState().selectedTab || annotationUI.getState().selectedTab === uiConstants.TAB_ORPHANS) {
      selectedTab = uiConstants.TAB_ANNOTATIONS;
    }

    annotationUI.clearSelectedAnnotations();
    annotationUI.selectTab(selectedTab);
  };
 
  $scope.gotoMainSelection = function () {
    $scope.mainTab = true;
    $route.reload()
    $scope.sidebarsearchresult=""
    $scope.displayedNumber = 5;
    var selectedTab = annotationUI.getState().selectedTab;
    if (!annotationUI.getState().selectedTab || annotationUI.getState().selectedTab === uiConstants.TAB_ORPHANS) {
      selectedTab = uiConstants.TAB_ANNOTATIONS;
    }

    annotationUI.selectTab(selectedTab);
  };

 $scope.gotoSearchSelection = function () {
    $scope.mainTab = false;
  };

 $scope.switchAnnotationTab = function (type) {
     if (annotationUI.getState().selectedSharedTab == 'ownannotation'){
         return true;
     }
     else{
         return false;   
     }
 };

  $scope.search = {
    query: function () {
      return annotationUI.getState().filterQuery;
    },
    update: function (query) {
      annotationUI.setFilterQuery(query);
    },
  };
  $scope.sidebarquery = 0;
  $scope.sidebarSearch = {
    query: function () {
      return annotationUI.getState().filterQuery;
    }, 
    update: function (query) {
      var total;
      var urllist;
      var searchParams = searchFilter.toObject(query)
      var actualquery = angular.extend(searchParams)
      $scope.sidebarquery1 = query
      var actualsearchResult = fetchSearch(store,actualquery).then(function(results){
      console.log(results)
      $scope.$apply(function() {
          $scope.sidebarquery = results.total
          $scope.sidebarsearchresult = results
        });
      datacollect.connectionsend("searchInSidebar");
      $scope.mainTab = !$scope.mainTab;
      $scope.mainTab = !$scope.mainTab;
      return results
      });
     

    },
  };
  $scope.displayedNumber = 5;
  $scope.getSearchValues = function(){
      return $scope.sidebarquery
  }

  $scope.loadMore = function() {
  var presentNumber = $scope.displayedNumber;
  console.log("in load more function")
  console.log (presentNumber)
  $scope.displayedNumber = presentNumber + 5;
  
  }
  $scope.queryStreamURL = function() {
    return serviceUrl('search.query', {query: $scope.sidebarquery1});
  };

  $scope.countPendingUpdates = streamer.countPendingUpdates;
  $scope.applyPendingUpdates = streamer.applyPendingUpdates;
};
