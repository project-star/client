'use strict';

var urlevents = require('./urlevents');

/** Watch the UI state and update scope properties. */
// @ngInject
function UrlUIController($rootScope, $scope, urlUI) {
  urlUI.subscribe(function () {
    var state = urlUI.getState();

    $scope.selectedUrls = state.selectedUrlMap;

    if (state.selectedUrlMap) {
      $scope.selectedUrlsCount =
        Object.keys(state.selectedUrlMap).length;
    } else {
      $scope.selectedUrlsCount = 0;
    }

    $scope.focusedUrls = state.focusedUrlMap;
  });

  $scope.$on(urlevents.URL_DELETED, function (event, url) {
    urlUI.removeSelectedUrl(url.id);
  });
}

module.exports = UrlUIController;
