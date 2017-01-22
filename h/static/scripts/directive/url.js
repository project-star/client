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
  console.log (changes)
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
  annotationMapper, drafts, flash, features, groups, permissions, serviceUrl,urlUI,urlMapper,urldrafts,
  session, store, streamer) {

  var vm = this;
  var newlyCreatedByHighlightButton;
  var newlyCreatedSearchCustom;
  /** Save an annotation to the server. */
  function save(url) {
    console.log("+++before sending to save+++")
    console.log(url)
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
      console.log("in save function")
      console.log(JSON.stringify(savedUrl))
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
    console.log(vm.url.annotation)
    vm.serviceUrl = serviceUrl;
    vm.inSharedView = false;
    vm.selectedForSharing = [];
    vm.renotedIdsForSharing ="example@renoted.com";
 }

  var loadEvents = [events.ANNOTATION_CREATED,
                    events.ANNOTATION_UPDATED,
                    events.ANNOTATIONS_LOADED,events.ANNOTATION_DELETED,urlevents.URLS_LOADED];
  var counter = 0;
  loadEvents.forEach(function (event) {
    $rootScope.$on(event, function (event, annotation) {
      console.log("+++++++++++++++in url.js +++++++++++++")
      console.log(event)
      console.log(annotation.id)
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
      
      console.log("+++++++++++++++++++++++++++++")
      console.log(event.name)
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
     console.log("expand clicked")
     vm.showAnnotations = true;
     vm.callFunc = true
    
   }

   vm.urledit = function(){
     console.log("urledit clicked")
     vm.isurlediting = true;
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
    console.log(vm.state())
    var updatedModel = updateModel(vm.url, vm.state());
    console.log("++++in save function click call +++")
    console.log(updatedModel)

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

  vm.toggleShareView = function () {
    console.log("In shared view: " + vm.inSharedView);
    if(vm.inSharedView)
      vm.inSharedView = false;
    else
      vm.inSharedView = true;
    console.log("In shared view now: " + vm.inSharedView);    
  };

  vm.selectedForSharingCount = function () {
    return vm.selectedForSharing.length;
  };

  vm.toggleSelectAllForSharing = function () {


    var sharingLength = vm.selectedForSharingCount();
    console.log("Length of sharing array on entering: "+sharingLength);

    //If anything is selected already, flush everything out
    if(sharingLength > 0) {
      vm.selectedForSharing.length = 0;       
    }
    //If nothing is selected already, select everything
    else {
      console.log("Adding annotations to the array!");
      for(var i=0; i<vm.annotation().length; i++)
        vm.selectedForSharing.push(vm.annotation()[i].id);
    }
  };

  vm.cancelShare = function() {
    //console.log("Entering the cancelShare method");
    //Flush any selected annotations
    vm.selectedForSharing.length=0;

    //Remove any id provided for sharing
    vm.renotedIdsForSharing = "";

    //Hide the Sharing header
    vm.inSharedView = false;
  };

  vm.clickToShare = function() {
    console.log("Entering the clickToShare method with emailid: " + vm.renotedIdsForSharing );
    //Call share API with selectedForSharing id list and ReNoted Id list
    //This should be an async call, have success and failure functions
    var data = {
      annotation_ids:vm.selectedForSharing,
      sharedtoemail:vm.renotedIdsForSharing
    };

    var shared = store.sharing.create({}, data);

    var onSuccess = function() {

      console.log("Shared successfully!??!" + shared);
      //On success, flush any selected annotations
      ///Remove any names provided for sharing
      //vm.renotedIdsForSharing.length = 0;
      //Hide the Sharing header
      vm.inSharedView = false;
    };

    var onFailure = function() {
      console.log("Couldn't share ...");
    }

    shared.then(onSuccess,onFailure);    
  }

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
