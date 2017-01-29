'use strict';

var angular = require('angular');

var urlevents = require('./urlevents');

function getExistingUrl(urlUI, id) {
  return urlUI.getState().urls.find(function (url) {
    return url.id === id;
  });
}

// Wraps the annotation store to trigger events for the CRUD actions
// @ngInject
function urlMapper($rootScope, urlUI, store) {
  function loadUrls(urls) {
    console.log("in url mpper load annotations")
    var loaded = [];
    urls.forEach(function (url) {
      var existing = getExistingUrl(urlUI, url.id);
      if (existing) {
        console.log("in url mpper load annotations")
        $rootScope.$broadcast(urlevents.URL_UPDATED, url);
        return;
      }
      loaded.push(url);
    });

    $rootScope.$broadcast(urlevents.URLS_LOADED, loaded);
  }

  function unloadUrls(urls) {
    var unloaded = urls.map(function (url) {
      var existing = getExistingUrl(urlUI, url.id);
      if (existing && url !== existing) {
        url = angular.copy(url, existing);
      }
      return url;
    });
    $rootScope.$broadcast(urlevents.URLS_UNLOADED, unloaded);
  }

  function createUrl(url) {
    $rootScope.$broadcast(urlevents.BEFORE_URL_CREATED, url);
    return url;
  }

  function deleteUrl(url) {
    return store.urlupdate.delete({
      id: url.id,
    }).then(function () {
      $rootScope.$broadcast(urlevents.URL_DELETED, url);
      return url;
    });
  }
  function deleteSharedUrl(url) {
    return store.sharing.deleteurl({
      id: url.id,
    }).then(function () {
      $rootScope.$broadcast(urlevents.URL_DELETED, url);
      return url;
    });
  }

  return {
    loadUrls: loadUrls,
    unloadUrls: unloadUrls,
    createUrl: createUrl,
    deleteUrl: deleteUrl,
    deleteSharedUrl: deleteSharedUrl,
  };
}


module.exports = urlMapper;
