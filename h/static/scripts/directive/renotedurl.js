/* eslint consistent-this: ["error", "vm"] */

'use strict';

var annotationMetadata = require('../annotation-metadata');
var events = require('../events');
var memoize = require('../util/memoize');
var persona = require('../filter/persona');

var isNew = annotationMetadata.isNew;
var isReply = annotationMetadata.isReply;

/** Return a human-readable error message for the given server error.
 *
 * @param {object} reason The error object from the server. Should have
 * `status` and, if `status` is not `0`, `statusText` and (optionally)
 * `data.reason` properties.
 *
 * @returns {string}
 */
function errorMessage(reason) {
  var message;
  if (reason.status <= 0) {
    message = 'Service unreachable.';
  } else {
    message = reason.status + ' ' + reason.statusText;
    if (reason.data && reason.data.reason) {
      message = message + ': ' + reason.data.reason;
    }
  }
  return message;
}

// @ngInject
function RenotedUrlController(
  $document, $q, $rootScope, $scope, $timeout, $window, annotationUI,
  annotationMapper, drafts, flash, features, groups, permissions, serviceUrl,
  session, store, streamer) {

  vm.renoted_id = function() {
    return "success";
  init();
}

// @ngInject
function renotedannotation() {
  return {
    restrict: 'E',
    bindToController: true,
    controller: RenotedUrlController,
    controllerAs: 'vm',
    scope: {
    },
    template: require('../../../templates/client/renotedurl.html'),
  };
}

module.exports = {
  // These private helper functions aren't meant to be part of the public
  // interface of this module. They've been exported temporarily to enable them
  // to be unit tested.
  // FIXME: The code should be refactored to enable unit testing without having
  // to do this.

  // These are meant to be the public API of this module.
  directive: renotedurl,
  Controller: RenotedUrlController,
};
