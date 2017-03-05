/* eslint consistent-this: ["error", "vm"] */

'use strict';

var annotationMetadata = require('../annotation-metadata');
var events = require('../events');
var urlevents = require('../urlevents');
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
function updateModel(url,changes) {
  return Object.assign({}, url, {
    // Explicitly copy across the non-enumerable local tag for the annotation
    $$tag: url.$$tag,

    // Apply changes from the draft
    tags: changes.tags,
  });
}
// @ngInject
function UrlController(
  $document, $q, $rootScope, $scope, $timeout, $window, annotationUI,$route,
  annotationMapper, drafts, flash, features, groups, permissions, serviceUrl,urldrafts,
  session, store, streamer) {

  var vm = this;
  var newlyCreatedByHighlightButton;
  var newlyCreatedSearchCustom;
  /** Save an annotation to the server. */
  function save(url) {
    var saved;
    saved = store.urlupdate.update({id: url.id}, url);
    return saved.then(function (savedUrl) {
      // Copy across internal properties which are not part of the annotation
      // model saved on the server
      savedUrl.$$tag = url.$$tag;
      Object.keys(url).forEach(function (k) {
        if (k[0] === '$') {
          savedUrl[k] = url[k];
        }
      });
      //DOMtoString(document,savedAnnot.id);
      return savedUrl;
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
    return list.then(function (receivedlist) {
    return receivedlist;
    });
   }
  
  function init() {
    // The remaining properties on vm are read-only properties for the
    // templates.
    vm.serviceUrl = serviceUrl;
 }

  var loadEvents = [events.ANNOTATION_CREATED,
                    events.ANNOTATION_UPDATED,
                    events.ANNOTATIONS_LOADED,events.ANNOTATION_DELETED,urlevents.URLS_LOADED];
  var counter = 0;
  loadEvents.forEach(function (event) {
    $rootScope.$on(event, function (event, annotation) {
      for (var i=0; i <(vm.annotation().length); i++) {
          if (event.name=="annotationUpdated" && annotation.id==vm.annotation()[i].id){
              vm.annotation()[i] = annotation
         }
         if (event.name=="annotationDeleted" && annotation.id==vm.annotation()[i].id){
              vm.annotation().splice(i,1)
         }
      }
      for (var i=0; i <(vm.url.annotation.length); i++) {
          if (event.name=="annotationUpdated" && annotation.id==vm.url.annotation[i].id){
              vm.url.annotation[i] = annotation
         }
          if (event.name=="annotationDeleted" && annotation.id==vm.url.annotation[i].id){
              vm.url.annotation.splice(i,1)
         }
      }
      for (var i=0; i <(vm.url.allannotation.length); i++) {
          if (event.name=="annotationUpdated" && annotation.id==vm.url.allannotation[i].id){
              vm.url.allannotation[i] = annotation
         }
          if (event.name=="annotationDeleted" && annotation.id==vm.url.allannotation[i].id){
              vm.url.allannotation.splice(i,1)
              vm.total = vm.url.allannotation.length
              if (vm.url.allannotation.length > 0){
                  vm.url.annotation.push(vm.url.allannotation[0])
                  vm.total = vm.url.allannotation.length
          } 
              else {
                  $rootScope.$broadcast(urlevents.URL_DELETED, vm.url);
                  vm.urldelete()
          }
         }
      }
      counter = counter +1;
      
    });
  });

  vm.id = function() {
     return vm.url.id || "success"
  }
  vm.user = function() {
     return vm.url.user;
  }

  vm.setTitleIcon = function() {
    if(vm.url.uriaddress.includes("youtube.com"))
      return "youtube";
    else if (vm.url.uriaddress.includes("soundcloud.com"))
      return "soundcloud";
    else
      return "text";
  }

  vm.titleLink = function() {
     return vm.url.uriaddress;
   }

  vm.annotation = function() {
     if (vm.showAnnotations){
     vm.total = vm.url.allannotation.length
     return vm.url.allannotation
       }
     else {
     return vm.url.annotation
     vm.total = vm.url.allannotation.length
     }
   }

  vm.display = function() {
     if (vm.showAnnotations){
     return vm.url.allannotation.length
       }
     else
     return vm.url.annotation.length
   }
  vm.total = vm.url.allannotation.length
  vm.titleText = function() {
    var titletext = vm.url.title;
     if (titletext.length > 70) {
    titletext = titletext.slice(0, 70) + '…';
      }
     return titletext;
   }

  vm.titleTextFull = function() {
    var titletext = vm.url.title;
     return titletext;
   }

  vm.deduplicatetags = function() {
     var allannots=[]
     allannots = vm.url.allannotation
     var urltags;
     urltags = vm.url.tags
     for (var i=0; i< allannots.length; i++) {
       urltags=urltags.concat(allannots[i].tags)
     }
     urltags=urltags.filter(function (item, pos) {return urltags.indexOf(item) == pos});
     return urltags

   }


   vm.state = function () {
    var urldraft = urldrafts.get(vm.url);
    if (urldraft) {
      return urldraft;
    }
    return {
      tags: vm.deduplicatetags(),
    };
  };

   vm.expand = function() {
     vm.showAnnotations = true;
     vm.callFunc = true
    
   }

   vm.urledit = function(){
     vm.isurlediting = true;
  }
  
  

  vm.receivedAnnotlist = function(id) {
     var receivedList
     vm.showAnnotations=true;
     store.url({id:vm.url.id}).then(function(receivedList) { 
     vm.callFunc = false  
     vm.List = receivedList
     return receivedList
   });
 }
   


   vm.collapse = function() {
     vm.showAnnotations = false;
   }

  
   vm.setTags = function (tags) {
    urldrafts.urlupdate(vm.url, {
      tags: tags,
    });

  };


   vm.save = function() {
    if (!vm.url.user) {
      flash.info('Please log in to save your annotations.');
      return Promise.resolve();
    }
    var updatedModel = updateModel(vm.url, vm.state());

    // Optimistically switch back to view mode and display the saving
    // indicator
    vm.isurlSaving = true;
    vm.isurlediting = false;
    return save(updatedModel).then(function (model) {
      Object.assign(updatedModel, model);

      vm.isurlSaving = false;
      vm.isurlediting= false;
      var urlevent = urlevents.URL_UPDATED;
//      var event = isNew(vm.annotation) ?
//        events.ANNOTATION_CREATED : events.ANNOTATION_UPDATED;
      urldrafts.remove(vm.url);

      $rootScope.$broadcast(urlevent, updatedModel);
    }).catch(function (reason) {
      vm.isurlSaving = false;
      vm.urledit();
      flash.error(
        errorMessage(reason), 'Saving url failed');
    });
  };

    vm.revert = function() {
    vm.isurlediting = false;
    urldrafts.remove(vm.url);
  };

    vm.tagStreamURL = function(tag) {
    return serviceUrl('search.tag', {tag: tag});
  }; 
    vm.urldelete = function() {
    return $timeout(function() {  // Don't use confirm inside the digest cycle.
      var msg = 'Are you sure you want to delete this url?';
      if ($window.confirm(msg)) {
        var onRejected = function(reason) {
          flash.error(
            errorMessage(reason), 'Deleting url failed');
        };
        $scope.$apply(function() {
          urlMapper.deleteUrl(vm.url).then(
            null, onRejected);
        });
      }
    }, true);
  };    
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
