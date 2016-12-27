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

/**
 * Return a copy of `annotation` with changes made in the editor applied.
 */
function updateModel(annotation, changes, permissions) {
  return Object.assign({}, annotation, {
    // Explicitly copy across the non-enumerable local tag for the annotation
    $$tag: annotation.$$tag,

    // Apply changes from the draft
    tags: changes.tags,
    text: changes.text,
    permissions: changes.isPrivate ?
      permissions.private() : permissions.shared(annotation.group),
  });
}
// @ngInject
function UrlController(
  $document, $q, $rootScope, $scope, $timeout, $window, annotationUI,
  annotationMapper, drafts, flash, features, groups, permissions, serviceUrl,urlUI,urlMapper,
  session, store, streamer) {

  var vm = this;
  var newlyCreatedByHighlightButton;
  var newlyCreatedSearchCustom;
  /** Save an annotation to the server. */
  function save(annot) {
    var saved;
    if (annot.id) {
      saved = store.annotation.update({id: annot.id}, annot);
    } else {
      saved = store.annotation.create({}, annot);
    }
    return saved.then(function (savedAnnot) {
      // Copy across internal properties which are not part of the annotation
      // model saved on the server
      savedAnnot.$$tag = annot.$$tag;
      Object.keys(annot).forEach(function (k) {
        if (k[0] === '$') {
          savedAnnot[k] = annot[k];
        }
      });
      //DOMtoString(document,savedAnnot.id);
      console.log("in save function")
      console.log(JSON.stringify(savedAnnot))
      return savedAnnot;
    });
  }

  /**
    * Initialize this AnnotationController instance.
    *
    * Initialize the `vm` object and any other variables that it needs,
    * register event listeners, etc.
    *
    * All initialization code intended to run when a new AnnotationController
    * instance is instantiated should go into this function, except defining
    * methods on `vm`. This function is called on AnnotationController
    * instantiation after all of the methods have been defined on `vm`, so it
    * can call the methods.
    */



  function list(uri_id) {
    var list;
    list = store.url({id:uri_id})
    console.log (list)
    return list.then(function (receivedlist) {
    console.log(receivedlist)
    return receivedlist;
    });
   }
  
  function init() {
    // The remaining properties on vm are read-only properties for the
    // templates.
    console.log("+++ in init in url.js++++")
    console.log(vm)
    vm.serviceUrl = serviceUrl;
  }

  vm.id = function() {
     return vm.url.id || "success"
  }
  vm.user = function() {
     return vm.url.user;
  }



  vm.titleLink = function() {
     return vm.url.uriaddress;
   }

  vm.annotation = function() {
     return vm.url.annotation;
   }
  vm.titleText = function() {
     return vm.url.title;
   }


   vm.state = function () {
    var tagsval =["hello","1234"]
    return {
      tags: tagsval,
    };
  };

   vm.expand = function() {
     console.log("expand clicked")
     vm.showAnnotations = true;
     vm.callFunc = true
    
   }


  vm.receivedAnnotlist = function(id) {
     var receivedList
     vm.showAnnotations=true;
     store.url({id:vm.url.id}).then(function(receivedList) { 
     console.log(receivedList)
     vm.callFunc = false  
     vm.List = receivedList
     return receivedList
   });
 }
   


   vm.collapse = function() {
     console.log("collapse clicked")
     vm.showAnnotations = false;
   }

 
    
  init();
}

// @ngInject
function url() {
  return {
    restrict: 'E',
    bindToController: true,
    controller: UrlController,
    controllerAs: 'vm',
    scope: {
      url: '<',
      showDocumentInfo: '<',
      onReplyCountClick: '&',
      replyCount: '<',
      isCollapsed: '<',
    },
    template: require('../../../templates/client/url.html'),
  };
}

module.exports = {
  // These private helper functions aren't meant to be part of the public
  // interface of this module. They've been exported temporarily to enable them
  // to be unit tested.
  // FIXME: The code should be refactored to enable unit testing without having
  // to do this.
  updateModel: updateModel,

  // These are meant to be the public API of this module.
  directive: url,
  Controller: UrlController,
};
