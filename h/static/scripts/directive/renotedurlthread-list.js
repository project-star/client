'use strict';

var events = require('../urlevents');
var metadata = require('../annotation-metadata');

/**
 * Component which displays a virtualized list of url threads.
 */

var scopeTimeout = require('../util/scope-timeout');

/**
 * Returns the height of the thread for a url thread if it exists in the view
 * or undefined otherwise.
 */
function getThreadHeight(id) {
  var threadElement = document.getElementById(id);
  if (!threadElement) {
    return null;
  }

  // Get the height of the element inside the border-box, excluding
  // top and bottom margins.
  var elementHeight = threadElement.getBoundingClientRect().height;

  var style = window.getComputedStyle(threadElement);

  // Get the bottom margin of the element. style.margin{Side} will return
  // values of the form 'Npx', from which we extract 'N'.
  var marginHeight = parseFloat(style.marginTop) +
                     parseFloat(style.marginBottom);

  return elementHeight + marginHeight;

}

// @ngInject
function RenotedUrlThreadListController($scope, UrlVirtualThreadList,urlUI,$route,session,datacollect) {
  // `visibleThreads` keeps track of the subset of all threads matching the
  // current filters which are in or near the viewport and the view then renders
  // only those threads, using placeholders above and below the visible threads
  // to reserve space for threads which are not actually rendered.
  var self = this;
  var visibleThreads = new UrlVirtualThreadList($scope, window, this.thread);
  console.log("+++++ visibleThreads +++++")
  console.log(visibleThreads)
  visibleThreads.on('changed', function (state) {
    self.UrlVirtualThreadList = {
      visibleThreads: state.visibleThreads,
      offscreenUpperHeight: state.offscreenUpperHeight + 'px',
      offscreenLowerHeight: state.offscreenLowerHeight + 'px',
    };

    scopeTimeout($scope, function () {
      state.visibleThreads.forEach(function (thread) {
        var height = getThreadHeight(thread.id);
        if (!height) {
          return;
        }
        visibleThreads.setThreadHeight(thread.id, height);
      });
    }, 50);
  });

  /**
   * Return the vertical scroll offset for the document in order to position the
   * annotation thread with a given `id` or $$tag at the top-left corner
   * of the view.
   */
  function scrollOffset(id) {
    // Note: This assumes that the element occupies the entire height of the
    // containing document. It would be preferable if only the contents of the
    // <renotedthread-list> itself scrolled.
    var maxYOffset = document.body.clientHeight - window.innerHeight;
    return Math.min(maxYOffset, visibleThreads.yOffsetOf(id));
  }

  /** Scroll the annotation with a given ID or $$tag into view. */
  function scrollIntoView(id) {
    var estimatedYOffset = scrollOffset(id);
    window.scroll(0, estimatedYOffset);

    // As a result of scrolling the sidebar, the target scroll offset for
    // annotation `id` might have changed as a result of:
    //
    // 1. Heights of some cards above `id` changing from an initial estimate to
    //    an actual measured height after the card is rendered.
    // 2. The height of the document changing as a result of any cards heights'
    //    changing. This may affect the scroll offset if the original target
    //    was near to the bottom of the list.
    //
    // So we wait briefly after the view is scrolled then check whether the
    // estimated Y offset changed and if so, trigger scrolling again.
    scopeTimeout($scope, function () {
      var newYOffset = scrollOffset(id);
      if (newYOffset !== estimatedYOffset) {
        scrollIntoView(id);
      }
    }, 200);
  }
  $scope.displayedNumber = 10;


  $scope.loadMore = function() {
  var presentNumber = $scope.displayedNumber;
  console.log("in load more function")
  console.log (presentNumber)
  $scope.displayedNumber = presentNumber + 10;
  
  }
  
  $scope.names = ["Update Time :Descending", "Update Time :Ascending", "Relevance", "Create Time :Ascending", "Create Time: Descending"];

  $scope.selectedSort=urlUI.getState().sortKey;
  $scope.initialLoad=true;  
  $scope.sortBy = function() {
    urlUI.setSortKey(this.selectedSort)
    datacollect.connectionsend("sortOnWebsite")
    return false
  }
  

  $scope.$on(events.BEFORE_URL_CREATED, function (event, url) {
    self.onClearSelection();
    scrollIntoView(url.$$tag);
  });

  this.$onChanges = function (changes) {
    if (changes.thread) {
      visibleThreads.setRootThread(changes.thread.currentValue);
    }
  };
  this.hasAnnotations = function() {
   if (visibleThreads._rootThread.children.length > 0) {
      return true ;
   }
   else {
      setTimeout(function() { 
        $scope.initialLoad = false; 
        urlUI.setSortKey(urlUI.getState().sortKey) 
      }, 1400);
      return $scope.initialLoad;
   }
  };

  this.loggedin = function() {
     if (session.state.userid){
       return true;
     }
     else {
       return false;
     }
  };

       

  this.$onDestroy = function () {
    visibleThreads.detach();
  };

}

module.exports = function () {
  return {
    bindToController: true,
    controller: RenotedUrlThreadListController,
    controllerAs: 'vm',
    restrict: 'E',
    scope: {
      /** The root thread to be displayed by the thread list. */
      thread: '<',
      showDocumentInfo: '<',

      /** Specifies if we are on the Shared stream page*/
      onSharedStream: '<',
      /**
       * Called when the user clicks a link to show an annotation that does not
       * match the current filter.
       */
      onForceVisible: '&',
      /** Called when the user focuses an annotation by hovering it. */
      onFocus: '&',
      /** Called when a user selects an annotation. */
      onSelect: '&',
      /** Called when a user toggles the expansion state of an annotation thread. */
      onChangeCollapsed: '&',
      /** Called to clear the current selection. */
      onClearSelection: '&',
    },
    template: require('../../../templates/client/renotedurlthread_list.html'),
  };
};