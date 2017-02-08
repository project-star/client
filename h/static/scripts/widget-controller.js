'use strict';

var SearchClient = require('./search-client');
var events = require('./events');
var memoize = require('./util/memoize');
var metadata = require('./annotation-metadata');
var tabCounts = require('./tab-counts');
var uiConstants = require('./ui-constants');

function firstKey(object) {
  for (var k in object) {
    if (!object.hasOwnProperty(k)) {
      continue;
    }
    return k;
  }
  return null;
}

/**
 * Returns the group ID of the first annotation in `results` whose
 * ID is a key in `selection`.
 */
function groupIDFromSelection(selection, results) {
  var id = firstKey(selection);
  var annot = results.find(function (annot) {
    return annot.id === id;
  });
  if (!annot) {
    return null;
  }
  return annot.group;
}

// @ngInject
module.exports = function WidgetController(
  $scope, annotationUI, annotationMapper, drafts, features, frameSync, groups,
  rootThread, settings, streamer, streamFilter, store,datacollect
) {
  function thread() {
    return rootThread.thread(annotationUI.getState());
  }

  var unsubscribeAnnotationUI = annotationUI.subscribe(function () {
    var state = annotationUI.getState();

    $scope.rootThread = thread();
    $scope.selectedTab = state.selectedTab;
    $scope.selectedSharedTab = state.selectedSharedTab;
    var counts = tabCounts(state.annotations, {
      separateOrphans: features.flagEnabled('orphans_tab'),
    });

    Object.assign($scope, {
      totalNotes: counts.notes,
      totalAnnotations: counts.annotations,
      totalOrphans: counts.orphans,
      totalOwnAnnotations: counts.ownannotations,
      totalSharedAnnotations: counts.sharedannotations,
      waitingToAnchorAnnotations: counts.anchoring > 0,
    });
  });


  $scope.$on('$destroy', unsubscribeAnnotationUI);

  function focusAnnotation(annotation) {
    var highlights = [];
    if (annotation) {
      highlights = [annotation.$$tag];
    }
    frameSync.focusAnnotations(highlights);
  }

  function scrollToAnnotation(annotation) {
    if (!annotation) {
      return;
    }
    frameSync.scrollToAnnotation(annotation.$$tag);
  }

  /** Returns the annotation type - note or annotation of the first annotation
   *  in `results` whose ID is a key in `selectedAnnotationMap`.
   */
  function tabContainingAnnotation(annot) {
    if (metadata.isOrphan(annot)) {
      if (features.flagEnabled('orphans_tab')) {
        return uiConstants.TAB_ORPHANS;
      } else {
        return uiConstants.TAB_ANNOTATIONS;
      }
    } else if (metadata.isPageNote(annot)) {
      return uiConstants.TAB_NOTES;
    } else {
      return uiConstants.TAB_ANNOTATIONS;
    }
  }
  function sharedtabContainingAnnotation(annot) {
    if (metadata.isSharing(annot)) {
      return 'sharedannotation';
    } else {
      return 'ownannotation';
    }
  }

  /**
   * Returns the Annotation object for the first annotation in the
   * selected annotation set. Note that 'first' refers to the order
   * of annotations passed to annotationUI when selecting annotations,
   * not the order in which they appear in the document.
   */
  function firstSelectedAnnotation() {
    if (annotationUI.getState().selectedAnnotationMap) {
      var id = Object.keys(annotationUI.getState().selectedAnnotationMap)[0];
      return annotationUI.getState().annotations.find(function (annot) {
        return annot.id === id;
      });
    } else {
      return null;
    }
  }

  var searchClients = [];

  function _resetAnnotations() {
    annotationMapper.unloadAnnotations(annotationUI.savedAnnotations());
  }

  function _loadAnnotationsFor(uris, group) {
    var searchClient = new SearchClient(store.search, {
      // If no group is specified, we are fetching annotations from
      // all groups in order to find out which group contains the selected
      // annotation, therefore we need to load all chunks before processing
      // the results
      incremental: !!group,
    });
    searchClients.push(searchClient);
    searchClient.on('results', function (results) {
      if (annotationUI.hasSelectedAnnotations()) {
        // Focus the group containing the selected annotation and filter
        // annotations to those from this group
        var groupID = groupIDFromSelection(
          annotationUI.getState().selectedAnnotationMap, results);
        if (!groupID) {
          // If the selected annotation is not available, fall back to
          // loading annotations for the currently focused group
          groupID = groups.focused().id;
        }
        results = results.filter(function (result) {
          return result.group === groupID;
        });
        groups.focus(groupID);
      }

      //RECALL CODE HAS BEEN COMMENTED HERE TEMPORARILY

/*      var recalleddata;
      var data={}
      data.url=uris[0]
      store.recall({},data).then(function (resultrecall) { 
         console.log (resultrecall)
         var todisplay = resultrecall.annotations.length
         if (resultrecall.annotations.length > 6){
             todisplay= 6
          }
         for (var i=0; i< todisplay; i++){
             if (resultrecall.annotations[i].uri != data.url){
             resultrecall.annotations[i].recall="first"
             results.push(resultrecall.annotations[i])
          }
          }
         console.log (results)
         annotationMapper.loadAnnotations(results);
         return results
                  });
*/      if (results.length) {
        // console.log("+++ in widget controller load annotations+++")
        // console.log(results.length)
        annotationMapper.loadAnnotations(results); //COMMENT THIS OUT WHEN RECALL IS ENABLED AGAIN
      }
    });
    searchClient.on('end', function () {
      // Remove client from list of active search clients.
      //
      // $evalAsync is required here because search results are emitted
      // asynchronously. A better solution would be that the loading state is
      // tracked as part of the app state.
      $scope.$evalAsync(function () {
        searchClients.splice(searchClients.indexOf(searchClient), 1);
      });
    });
    console.log("+++in widget controller search++++")
    console.log(uris)
    searchClient.get({uri: uris, group: group});
  }

  function isLoading() {
    if (!frameSync.frames.some(function (frame) { return frame.uri; })) {
      // The document's URL isn't known so the document must still be loading.
      return true;
    }

    if (searchClients.length > 0) {
      // We're still waiting for annotation search results from the API.
      return true;
    }

    return false;
  }

  /**
   * Load annotations for all URLs associated with `frames`.
   *
   * @param {Array<{uri:string}>} frames - Hypothesis client frames
   *        to load annotations for.
   */
  function loadAnnotations(frames, reset) {
    if (reset || typeof reset === 'undefined') {
      _resetAnnotations();
    }

    searchClients.forEach(function (client) {
      client.cancel();
    });

    var searchUris = frames.reduce(function (uris, frame) {
      for (var i = 0; i < frame.searchUris.length; i++) {
        var uri = frame.searchUris[i];
        if (uris.indexOf(uri) === -1) {
          uris.push(uri);
        }
      }
      return uris;
    }, []);

    // If there is no selection, load annotations only for the focused group.
    //
    // If there is a selection, we load annotations for all groups, find out
    // which group the first selected annotation is in and then filter the
    // results on the client by that group.
    //
    // In the common case where the total number of annotations on
    // a page that are visible to the user is not greater than
    // the batch size, this saves an extra roundtrip to the server
    // to fetch the selected annotation in order to determine which group
    // it is in before fetching the remaining annotations.
    var group = annotationUI.hasSelectedAnnotations() ?
      null : groups.focused().id;

    if (searchUris.length > 0) {
      _loadAnnotationsFor(searchUris, group);

      streamFilter.resetFilter().addClause('/uri', 'one_of', searchUris);
      streamer.setConfig('filter', {filter: streamFilter.getFilter()});
    }
  }

  $scope.$on('sidebarOpened', function () {
    streamer.connect();
    console.log("+++in widget sidebaropened++++")
    datacollect.connectionsend('sidebarOpened');
    
  });

  // If the user is logged in, we connect nevertheless
  if ($scope.auth.status === 'logged-in') {
    streamer.connect();
    datacollect.connect();
    datacollect.connectionsend('NewConnectionLogin');
  }

  $scope.$on(events.USER_CHANGED, function () {
    streamer.reconnect();
    datacollect.reconnect();
    datacollect.connectionsend(events.USER_CHANGED);
  });

  $scope.$on(events.ANNOTATIONS_SYNCED, function (event, tags) {
    // When a direct-linked annotation is successfully anchored in the page,
    // focus and scroll to it
    var selectedAnnot = firstSelectedAnnotation();
    if (!selectedAnnot) {
      return;
    }
    var matchesSelection = tags.some(function (tag) {
      return tag === selectedAnnot.$$tag;
    });
    if (!matchesSelection) {
      return;
    }
    focusAnnotation(selectedAnnot);
    scrollToAnnotation(selectedAnnot);
    var targetSharedTab = sharedtabContainingAnnotation(selectedAnnot);
    var targetTab = tabContainingAnnotation(selectedAnnot);
    annotationUI.selectTab(targetTab);
    annotationUI.selectSharedTab(targetSharedTab);
  });

  $scope.$on(events.GROUP_FOCUSED, function () {
    // The focused group may be changed during loading annotations as a result
    // of switching to the group containing a direct-linked annotation.
    //
    // In that case, we don't want to trigger reloading annotations again.
    if (isLoading()) {
      return;
    }
    annotationUI.clearSelectedAnnotations();
    loadAnnotations(frameSync.frames);
  });

  // Watch anything that may require us to reload annotations.
  $scope.$watchCollection(function () {
    return frameSync.frames;
  }, loadAnnotations);

  $scope.setCollapsed = function (id, collapsed) {
    annotationUI.setCollapsed(id, collapsed);
  };

  $scope.forceVisible = function (thread) {
    annotationUI.setForceVisible(thread.id, true);
    if (thread.parent) {
      annotationUI.setCollapsed(thread.parent.id, false);
    }
  };

  $scope.focus = focusAnnotation;
  $scope.scrollTo = scrollToAnnotation;
//  $scope.switchAnnotationTab = function (type) {
//    console.log(type)

// };
  $scope.selectedAnnotationCount = function () {
    var selection = annotationUI.getState().selectedAnnotationMap;
    if (!selection) {
      return 0;
    }
    return Object.keys(selection).length;
  };

  $scope.selectedAnnotationUnavailable = function () {
    var selectedID = firstKey(annotationUI.getState().selectedAnnotationMap);
    return !isLoading() &&
           !!selectedID &&
           !annotationUI.annotationExists(selectedID);
  };

  $scope.shouldShowLoggedOutMessage = function () {
    // If user is not logged out, don't show CTA.
    if ($scope.auth.status !== 'logged-out') {
      return false;
    }

    // If user has not landed on a direct linked annotation
    // don't show the CTA.
    if (!settings.annotations) {
      return false;
    }

    // The user is logged out and has landed on a direct linked
    // annotation. If there is an annotation selection and that
    // selection is available to the user, show the CTA.
    var selectedID = firstKey(annotationUI.getState().selectedAnnotationMap);
    return !isLoading() &&
           !!selectedID &&
           annotationUI.annotationExists(selectedID);
  };

  $scope.isLoading = isLoading;
  var visibleCount = memoize(function (thread) {
    return thread.children.reduce(function (count, child) {
      return count + visibleCount(child);
    }, thread.visible ? 1 : 0);
  });

  $scope.visibleCount = function () {
    return visibleCount(thread());
  };

  $scope.topLevelThreadCount = function () {
    return thread().totalChildren;
  };
};
