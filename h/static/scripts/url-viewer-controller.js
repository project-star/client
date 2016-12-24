'use strict';

var angular = require('angular');

/**
 * Fetch all annotations in the same thread as `id`.
 *
 * @return Promise<Array<Annotation>>
 */
function fetchThread(store, id) {
  var annot;
  console.log("in prefetch thread")
  return store.url({id: id}).then(function (annot) {
    console.log("in fetch thread")
    if (annot.references && annot.references.length) {
      // This is a reply, fetch the top-level annotation
      return store.annotation.get({id: annot.references[0]});
    } else {
      return annot;
    }
  }).then(function (annot_) {
    annot = annot_;
    return store.search({references: annot.id});
  }).then(function (searchResult) {
    return [annot].concat(searchResult.rows);
  });
}


function renotedfetchThread(store) {
  var urlwise;
  var urlvalue;
  var result;
  var i=0;
  result=[]
  console.log("in prefetch thread")
  return store.urls().then(function (urlwise) {
    console.log("in urlfetch thread")
      for (i = 0; i < urlwise.total; i++) { 
          urlvalue = urlwise.urllist[i]
          result = result.concat(urlvalue)     
    }
         
    return result 
  });
}




// @ngInject
function UrlViewerController (
  $location, $routeParams, $scope,
  annotationUI, rootThread, streamer, store, streamFilter, annotationMapper
) {
  annotationUI.setAppIsSidebar(false);

  var id = $routeParams.id;

  // Provide no-ops until these methods are moved elsewere. They only apply
  // to annotations loaded into the stream.
  $scope.focus = angular.noop;

  $scope.search.update = function (query) {
    $location.path('/stream').search('q', query);
  };

  annotationUI.subscribe(function () {
    $scope.rootThread = rootThread.thread(annotationUI.getState());
  });

  $scope.setCollapsed = function (id, collapsed) {
    annotationUI.setCollapsed(id, collapsed);
  };

  this.ready = renotedfetchThread(store).then(function (urls) {
    console.log("++++++ in ready renoted annotation++++++") 
    console.log(urls)
    annotationMapper.loadAnnotations(annots);
    var topLevelAnnot = annots.filter(function (annot) {
      return (annot.references || []).length === 0;
    })[0];

    if (!topLevelAnnot) {
      return;
    }

    streamFilter
      .setMatchPolicyIncludeAny()
      .addClause('/references', 'one_of', topLevelAnnot.id, true)
      .addClause('/id', 'equals', topLevelAnnot.id, true);
    streamer.setConfig('filter', { filter: streamFilter.getFilter() });
    streamer.connect();

    annots.forEach(function (annot) {
      annotationUI.setCollapsed(annot.id, false);
    });

    if (topLevelAnnot.id !== id) {
      annotationUI.highlightAnnotations([id]);
    }
  });
}

module.exports = UrlViewerController;
