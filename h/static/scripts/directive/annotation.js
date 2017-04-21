/* eslint consistent-this: ["error", "vm"] */

'use strict';

var annotationMetadata = require('../annotation-metadata');
var events = require('../events');
var memoize = require('../util/memoize');
var persona = require('../filter/persona');
//require('https://w.soundcloud.com/player/api.js');

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

function convertTime(val){
  val = Math.floor(val);
      var hr = Math.floor(val/3600);
      var hr_mod = val % 3600;
      var min = Math.floor(hr_mod/60);
      var sec = hr_mod % 60;


      if(hr < 10)
        hr = "0"+hr;
      if(min < 10)
        min = "0"+min;
      if(sec<10)
        sec = "0"+sec;

      // This formats your string to HH:MM:SS
       var t = hr+":"+min+":"+sec;
       if (hr=="00") {
         t=min+":"+sec;}
       return t;

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
function AnnotationController(
  $document, $q, $rootScope, $scope, $timeout, $window, annotationUI,$interval,
  annotationMapper, drafts, flash, features, groups, permissions, serviceUrl,
  session, store, streamer, scService,vidService) {

  var vm = this;
  var newlyCreatedByHighlightButton;
  var newlyCreatedSearchCustom;
  var newlyCreatedMedia;
  /** Save an annotation to the server. */
  function save(annot) {
    var saved;
    if (annot.$newMedia){
       annot.$newMedia=false;
    }
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
  function init() {
    // The remaining properties on vm are read-only properties for the
    // templates.

    vm.serviceUrl = serviceUrl;

    /** Give the template access to the feature flags. */
    vm.feature = features.flagEnabled;

    /** Determines whether controls to expand/collapse the annotation body
     * are displayed adjacent to the tags field.
     */
    vm.canCollapseBody = false;

    /** Determines whether the annotation body should be collapsed. */
    vm.collapseBody = true;

    /** True if the annotation is currently being saved. */
    vm.isSaving = false;
    vm.editingendtime = false;
    /** True if the 'Share' dialog for this annotation is currently open. */
    vm.showShareDialog = false;

    /** if True the Video frame will be loaded*/
    vm.loadVideo = true;
    /**
      * `true` if this AnnotationController instance was created as a result of
      * the highlight button being clicked.
      *
      * `false` if the annotation button was clicked, or if this is a highlight
      * or annotation that was fetched from the server (as opposed to created
      * new client-side).
      */
    newlyCreatedByHighlightButton = vm.annotation.$highlight || false;
    newlyCreatedMedia = vm.annotation.$newMedia || false;
    // New annotations (just created locally by the client, rather then
    // received from the server) have some fields missing. Add them.
    vm.annotation.user = vm.annotation.user || session.state.userid;
    vm.annotation.group = vm.annotation.group || groups.focused().id;
    if (!vm.annotation.permissions) {
      vm.annotation.permissions = permissions.default(vm.annotation.group);
    }
    vm.annotation.page_data = vm.annotation.text || '';
    vm.annotation.text = vm.annotation.text || '';
    if (!Array.isArray(vm.annotation.tags)) {
      vm.annotation.tags = [];
    }
    vm.annotation.searchcustom = vm.annotation.$search || false
    vm.annotation.renoted_id = vm.annotation.$renoted_id || vm.annotation.renoted_id;
    newlyCreatedSearchCustom = vm.annotation.$search || false

    if (newlyCreatedMedia) {
      var newMediaParams = vm.annotation.params
      vm.thePlayerTime = newMediaParams[0].curTime
      vm.thePlayerRate = newMediaParams[0].curRate
      vm.thePlayerState = newMediaParams[0].curState
    }

    // Automatically save new highlights to the server when they're created.
    // Note that this line also gets called when the user logs in (since
    // AnnotationController instances are re-created on login) so serves to
    // automatically save highlights that were created while logged out when you
    // log in.
    saveNewHighlight();

    // If this annotation is not a highlight and if it's new (has just been
    // created by the annotate button) or it has edits not yet saved to the
    // server - then open the editor on AnnotationController instantiation.
    if (!newlyCreatedByHighlightButton) {
      if (isNew(vm.annotation) || drafts.get(vm.annotation)) {
        vm.edit();
      }
    }
  }

  /** Save this annotation if it's a new highlight.
   *
   * The highlight will be saved to the server if the user is logged in,
   * saved to drafts if they aren't.
   *
   * If the annotation is not new (it has already been saved to the server) or
   * is not a highlight then nothing will happen.
   *
   */
  function saveNewHighlight() {
    if (!isNew(vm.annotation)) {
      // Already saved.
      return;
    }

    if (!vm.isHighlight()) {
      // Not a highlight,
      return;
    }

    if (vm.annotation.user) {
      // User is logged in, save to server.
      // Highlights are always private.
      vm.annotation.permissions = permissions.private();
      
      save(vm.annotation).then(function(model) {
        model.$$tag = vm.annotation.$$tag;
        $rootScope.$broadcast(events.ANNOTATION_CREATED, model);
      });
    } else {
      // User isn't logged in, save to drafts.
      drafts.update(vm.annotation, vm.state());
    }
  }

  /**
    * @ngdoc method
    * @name annotation.AnnotationController#authorize
    * @param {string} action The action to authorize.
    * @returns {boolean} True if the action is authorized for the current user.
    * @description Checks whether the current user can perform an action on
    * the annotation.
    */
  vm.authorize = function(action) {
    // TODO: this should use auth instead of permissions but we might need
    // an auth cache or the JWT -> userid decoding might start to be a
    // performance bottleneck and we would need to get the id token into the
    // session, which we should probably do anyway (and move to opaque bearer
    // tokens for the access token).
    return permissions.permits(action, vm.annotation, session.state.userid);
  };
  vm.newMedia = function() {
    return vm.annotation.$newMedia || false;
  };

  /**
    * @ngdoc method
    * @name annotation.AnnotationController#delete
    * @description Deletes the annotation.
    */
  vm.delete = function() {
    return $timeout(function() {  // Don't use confirm inside the digest cycle.
      var msg = 'Are you sure you want to delete this annotation?';
      if ($window.confirm(msg)) {
        var onRejected = function(reason) {
          flash.error(
            errorMessage(reason), 'Deleting annotation failed');
        };
        $scope.$apply(function() {
          annotationMapper.deleteAnnotation(vm.annotation).then(
            null, onRejected);
        });
      }
    }, true);
  };

  var loadEvents = ["mediaStateChanged"];
  loadEvents.forEach(function (event) {
    $rootScope.$on(event, function (event, msg) {
          vm.thePlayerTime = msg.curTime;
          vm.thePlayerRate = msg.curRate;
          vm.thePlayerState = msg.curState;
    });
  });
  /**
    * @ngdoc method
    * @name annotation.AnnotationController#edit
    * @description Switches the view to an editor.
    */
  vm.edit = function() {
    if (!drafts.get(vm.annotation)) {
      drafts.update(vm.annotation, vm.state());
    }
  };
  vm.editendtime = function() {
      vm.editingendtime = true;
    }

  vm.canceleditendtime = function() {
     vm.editingendtime = false;
  };
  /**
   * @ngdoc method
   * @name annotation.AnnotationController#editing.
   * @returns {boolean} `true` if this annotation is currently being edited
   *   (i.e. the annotation editor form should be open), `false` otherwise.
   */
  vm.editing = function() {
    return drafts.get(vm.annotation) && !vm.isSaving;
  };

  /**
    * @ngdoc method
    * @name annotation.AnnotationController#group.
    * @returns {Object} The full group object associated with the annotation.
    */
  vm.group = function() {
    return groups.get(vm.annotation.group);
  };
  vm.renoted_id = function() {
    return vm.annotation.renoted_id;
   }

  //Audio related methods
  vm.isAudio = function() {
    if (vm.annotation.hasOwnProperty('auddata')){
       return true;
       }
    else
       return false;
  }


  // Video related methods
  vm.isVideo = function() {
    if (vm.annotation.hasOwnProperty('viddata')){
       return true;
       }
    else
       return false;
   } 
     

  $scope.trustSrcurl = function(data) 
  {
    return $sce.trustAsResourceUrl(data);
  }

  //Generates unique Id for the sc player
  vm.getPlayerId = function() {
    var playerId = vm.annotation.renoted_id.toString();
    return playerId;
  }

  //URL to be embedded into Audio Widget
  vm.audioEmbedUrl = function() {
    
    var scUrl = "https://w.soundcloud.com/player/?url=";

    if(vm.annotation.hasOwnProperty('auddata')) {
      var soundURL = scUrl + vm.annotation.auddata[0].uri;
      return soundURL;
    }
    else
      return "error";
  }

  //Load the soundcloud Widget with correct settings
  vm.loadAudioWidget = function() {
    var playerId = vm.getPlayerId();
    //Get the start and end times from the auddata
    var startTime = vm.annotation.auddata[0].starttime;
    var endTime = vm.annotation.auddata[0].endtime;
    //var audUrl = "http://w.soundcloud.com/player/?url=" + vm.annotation.auddata[0].uri;
    //var audioFrame = $scope.getElementById("renotedSCWidget");
    var vmWidget = SC.Widget(playerId);
    //vmWidget.load(vm.annotation.auddata[0].uri);


    vmWidget.bind(SC.Widget.Events.READY, function() {
      vmWidget.play();
    });

    vmWidget.bind(SC.Widget.Events.PLAY, function() {
      vmWidget.seekTo(startTime);
      vmWidget.pause();
      vmWidget.unbind(SC.Widget.Events.PLAY);
    });
  
    vmWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function() {
      vmWidget.getPosition(function (audioPos) {
        if ( audioPos <= endTime ) {
        }
        else {
          vmWidget.pause();
          vmWidget.unbind(SC.Widget.Events.PLAY_PROGRESS);
        }
      });   
    });
  }

  
 vm.getVideoType = function(uri) {
   if (uri.includes("vimeo.com")){
      return "vimeo"
   }
  else if (uri.includes("dailymotion.com")){
      return "dailymotion"
   }
  else
      return "unknown"

}
 
vm.getVideoId = function(){
  if (vm.annotation.hasOwnProperty('viddata')){
       if (vm.annotation.viddata[0].hasOwnProperty('newPlatform')) {
         var urival=vm.annotation.viddata
         var annotateduri=urival[0].uri
         if (annotateduri.includes("vimeo.com")){
       var videoId = annotateduri.split("https://vimeo.com/")[1]
       console.log (videoId)
       return videoId
    }
   }
   else
      return "unknown"
    
}
}

vm.isVimeo = function(){
   if (vm.annotation.hasOwnProperty('viddata')){
       if (vm.annotation.viddata[0].hasOwnProperty('newPlatform')) {
           var urival=vm.annotation.viddata
           var annotateduri=urival[0].uri
           if (annotateduri.includes("vimeo.com")){
              return true
           }
         }
     }
     return false
  }

vm.isNewPlatform = function(){
   if (vm.annotation.hasOwnProperty('viddata')){
       if (vm.annotation.viddata[0].hasOwnProperty('newPlatform')) {
              return true
           }
        else
              return false
     }
   else
     return false
  }


  //URL to be embedded into Video player
  vm.videoembedurl = function() {    
     if (vm.annotation.hasOwnProperty('viddata')){
       if (vm.annotation.viddata[0].hasOwnProperty('newPlatform')) {
           var urival=vm.annotation.viddata
           var annotateduri=urival[0].uri
           if (annotateduri.includes("vimeo.com")){
             var vimeourl = "https://player.vimeo.com/video/" + vm.getVideoId()
             console.log(vimeourl)
             return vimeourl
           }
         }
           var urival=vm.annotation.viddata
           var annotateduri=urival[0].uri
           var id=annotateduri.split('v=')[1]
           id = id.split('&')[0]
           var starttime=Math.round(vm.annotation.viddata[0].starttime).toString()
           var endtime=Math.round(vm.annotation.viddata[0].endtime).toString()
           var val="https://www.youtube.com/embed/"+id+"?start="+starttime+"&end=" + endtime
           if(vm.loadVideo)
            return val;
           else
           {
              //FIXME: This is a hack to reload the iframe on clicking the load/reload button
              //needs to be fixed with a directive level watch implementation
              var val2="https://youtube.com/embed/"+id+"?start="+starttime+"&end=" + endtime;
              return val2;
          }
     }
     else {
       return "success"
      }
    
 }
 //FIXME: Do a proper implementation. Used to reload Youtube frame (Dummy function)
 vm.setLoadVideo = function() {
  
  vm.loadVideo = !vm.loadVideo;
 }


 //Modifying the function to keep it generic - handling any media - Audio OR Video
   vm.thePlayerTime = annotationUI.getState().vidParams.curTime
   vm.thePlayerRate = annotationUI.getState().vidParams.curRate
   vm.thePlayerState = annotationUI.getState().vidParams.curState
  $interval(function () {
       if (vm.thePlayerState == 1){
       vm.thePlayerTime = vm.thePlayerTime + vm.thePlayerRate;
       }
       else {
       vm.thePlayerTime = vm.thePlayerTime;
      }
    }, vm.thePlayerRate*1000);
   vm.getPlayertime = function() {
      return convertTime(vm.thePlayerTime);
   }
   vm.getStarttime = function() {
    //Process only if audio or video
    if(!vm.isVideo() && !vm.isAudio())
      return "success";

     var starttime = 0;

     if (vm.annotation.hasOwnProperty('viddata')) {
       starttime=(vm.annotation.viddata[0].starttime);
     }
     else if (vm.annotation.hasOwnProperty('auddata')) {
      
      starttime=(vm.annotation.auddata[0].starttime);
      starttime = starttime / 1000; //converting to seconds
     }

     starttime = Math.floor(starttime);
     var hr = Math.floor(starttime/3600);
     var hr_mod = starttime % 3600;
     var min = Math.floor(hr_mod/60);
     var sec = hr_mod % 60;

      if(hr < 10)
        hr = "0"+hr;
      if(min < 10)
        min = "0"+min;
      if(sec<10)
        sec = "0"+sec;

      // This formats your string to HH:MM:SS
      var t = hr+":"+min+":"+sec;
      if (hr=="00") {
        t=min+":"+sec;}
      return t;
      
 }

//Modifying the function to keep it generic - handling any media - Audio OR Video
    vm.getEndtime = function() {

      //Process only if audio or video
      if(!vm.isVideo() && !vm.isAudio())
        return "success";

      var endtime = 0;

     if (vm.annotation.hasOwnProperty('viddata')) {
       endtime=(vm.annotation.viddata[0].endtime);
     }
     else if (vm.annotation.hasOwnProperty('auddata')) {
       endtime=(vm.annotation.auddata[0].endtime);
       endtime = endtime / 1000; //convert to seconds
     }
      
      endtime = Math.floor(endtime);
      var hr = Math.floor(endtime/3600);
      var hr_mod = endtime % 3600;
      var min = Math.floor(hr_mod/60);
      var sec = hr_mod % 60;

      if(hr < 10)
        hr = "0"+hr;
      if(min < 10)
        min = "0"+min;
      if(sec<10)
        sec = "0"+sec;
      // This formats your string to HH:MM:SS
       var t = hr+":"+min+":"+sec;
       if (hr=="00") {
         t=min+":"+sec;
       }
       return t;
      
 }

 //Modifying the function to keep it generic - handling any media - Audio OR Video
     vm.getDuration = function() {

      //Process only if audio or video
      if(!vm.isVideo() && !vm.isAudio())
        return "success";

      var starttime = 0;
      var endtime = 0;
      var val;
     if (vm.annotation.hasOwnProperty('viddata')){

       starttime=(vm.annotation.viddata[0].starttime);
       endtime=(vm.annotation.viddata[0].endtime);
       val = (endtime-starttime);
     }
     else if (vm.annotation.hasOwnProperty('auddata')) {
       starttime=(vm.annotation.auddata[0].starttime);
       endtime=(vm.annotation.auddata[0].endtime);  
       val = (endtime-starttime) / 1000;    
     }

      val = Math.floor(val);
      var hr = Math.floor(val/3600);
      var hr_mod = val % 3600;
      var min = Math.floor(hr_mod/60);
      var sec = hr_mod % 60;


      if(hr < 10)
        hr = "0"+hr;
      if(min < 10)
        min = "0"+min;
      if(sec<10)
        sec = "0"+sec;

      // This formats your string to HH:MM:SS
       var t = hr+":"+min+":"+sec;
       if (hr=="00") {
         t=min+":"+sec;}
       return t;
      
 }



   
  vm.typetodisplay = function() {
   return vm.annotation.type || "first";
  }
  /**
    * @ngdoc method
    * @name annotation.AnnotaitonController#hasContent
    * @returns {boolean} `true` if this annotation has content, `false`
    *   otherwise.
    */
  vm.hasContent = function() {
    return vm.state().text.length > 0 || vm.state().tags.length > 0;
  };

  /**
    * @returns {boolean} True if this annotation has quotes
    */
  vm.hasQuotes = function() {
    return vm.annotation.target.some(function(target) {
      return target.selector && target.selector.some(function(selector) {
        return selector.type === 'TextQuoteSelector';
      });
    });
  };

  vm.id = function() {
    return vm.annotation.id;
  };

  /**
    * @ngdoc method
    * @name annotation.AnnotationController#isHighlight.
    * @returns {boolean} true if the annotation is a highlight, false otherwise
    */
  vm.isHighlight = function() {
    if (newlyCreatedByHighlightButton) {
      return true;
    } else if (isNew(vm.annotation)) {
      return false;
    } else {
      // Once an annotation has been saved to the server there's no longer a
      // simple property that says whether it's a highlight or not.  For
      // example there's no vm.annotation.highlight: true.  Instead a highlight is
      // defined as an annotation that isn't a page note or a reply and that
      // has no text or tags.
      var isPageNote = (vm.annotation.target || []).length === 0;
      return (!isPageNote && !isReply(vm.annotation) && !vm.hasContent());
    }
  };
  vm.isSearchCustom = function() {
    if (newlyCreatedSearchCustom) {
      return true;
    } else if (isNew(vm.annotation)) {
      return false;
    } else if (newlyCreatedByHighlightButton) {
      return false;
    } else {
      // Once an annotation has been saved to the server there's no longer a
      // simple property that says whether it's a highlight or not.  For
      // example there's no vm.annotation.highlight: true.  Instead a highlight is
      // defined as an annotation that isn't a page note or a reply and that
      // has no text or tags.
      var isPageNote = (vm.annotation.target || []).length === 0;
      return (!isPageNote && !isReply(vm.annotation) && !vm.hasContent());
    }
  };
  /**
    * @ngdoc method
    * @name annotation.AnnotationController#isShared
    * @returns {boolean} True if the annotation is shared (either with the
    * current group or with everyone).
    */
  vm.isShared = function() {
    return !vm.state().isPrivate;
  };

  vm.isSharedAnnot = function(){
     return vm.annotation.hasOwnProperty("sharedbyuser")
   }

  vm.sharedbyuser = function(){
     if (vm.annotation.hasOwnProperty("sharedbyuser")){
        return vm.annotation.sharedbyuser.split(":")[1].split("@")[0];
     }
    else 
        return "failure"

  }

  // Save on Meta + Enter or Ctrl + Enter.
  vm.onKeydown = function (event) {
    if (event.keyCode === 13 && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      vm.save();
    }
  };

  vm.toggleCollapseBody = function(event) {
    event.stopPropagation();
    vm.collapseBody = !vm.collapseBody;
  };

  /**
    * @ngdoc method
    * @name annotation.AnnotationController#reply
    * @description
    * Creates a new message in reply to this annotation.
    */
  vm.reply = function() {
    var references = (vm.annotation.references || []).concat(vm.annotation.id);
    var group = vm.annotation.group;
    var replyPermissions;
    if (session.state.userid) {
      replyPermissions = vm.state().isPrivate ?
        permissions.private() : permissions.shared(group);
    }
    annotationMapper.createAnnotation({
      group: group,
      references: references,
      permissions: replyPermissions,
      uri: vm.annotation.uri,
    });
  };

  /**
    * @ngdoc method
    * @name annotation.AnnotationController#revert
    * @description Reverts an edit in progress and returns to the viewer.
    */
  vm.revert = function() {
    drafts.remove(vm.annotation);
    if (isNew(vm.annotation)) {
      $rootScope.$broadcast(events.ANNOTATION_DELETED, vm.annotation);
    }
  };

  vm.save = function() {
    if (!vm.annotation.user) {
      flash.info('Please log in to save your annotations.');
      return Promise.resolve();
    }
    if (!vm.hasContent() && vm.isShared() && !vm.newMedia()) {
      flash.info('Please add text or a tag before publishing.');
      return Promise.resolve();
    }
    /*
    if (vm.isVideo()) {
      var ytPlayer = document.getElementById("movie_player");
      endtime = ytPlayer.getCurrentTime();

//      var recordButton = document.getElementsByName("insert-video-clip-start");
//      recordButton[0].disabled = false;
    }
    */
    if (vm.newMedia()){
       vm.annotation.viddata[0].endtime = vm.thePlayerTime
    }
    var updatedModel = updateModel(vm.annotation, vm.state(), permissions);

    // Optimistically switch back to view mode and display the saving
    // indicator
    vm.isSaving = true;

    return save(updatedModel).then(function (model) {
      Object.assign(updatedModel, model);

      vm.isSaving = false;

      var event = isNew(vm.annotation) ?
        events.ANNOTATION_CREATED : events.ANNOTATION_UPDATED;
      drafts.remove(vm.annotation);

      $rootScope.$broadcast(event, updatedModel);
    }).catch(function (reason) {
      vm.isSaving = false;
      vm.edit();
      flash.error(
        errorMessage(reason), 'Saving annotation failed');
    });
  };

  /**
    * @ngdoc method
    * @name annotation.AnnotationController#setPrivacy
    *
    * Set the privacy settings on the annotation to a predefined
    * level. The supported levels are 'private' which makes the annotation
    * visible only to its creator and 'shared' which makes the annotation
    * visible to everyone in the group.
    *
    * The changes take effect when the annotation is saved
    */
  vm.setPrivacy = function(privacy) {
    // When the user changes the privacy level of an annotation they're
    // creating or editing, we cache that and use the same privacy level the
    // next time they create an annotation.
    // But _don't_ cache it when they change the privacy level of a reply.
    if (!isReply(vm.annotation)) {
      permissions.setDefault(privacy);
    }

    drafts.update(vm.annotation, {
      tags: vm.state().tags,
      text: vm.state().text,
      page_data: vm.state().text,
      isPrivate: privacy === 'private',
    });
  };

  vm.tagStreamURL = function(tag) {
    return serviceUrl('search.tag', {tag: tag});
  };
  vm.page_data = function() {
    return vm.annotation.text;
  };

  vm.target = function() {
    return vm.annotation.target;
  };

  // Note: We fetch the feature flag outside the `isOrphan` method to avoid a
  // lookup on every $digest cycle
  var indicateOrphans = features.flagEnabled('orphans_tab');

  vm.isOrphan = function() {
    return vm.annotation.$orphan && indicateOrphans;
  };

  vm.updated = function() {
    return vm.annotation.updated;
  };

  vm.user = function() {
    return vm.annotation.user;
  };

  vm.username = function() {
    return persona.username(vm.annotation.user);
  };

  vm.isDeleted = function () {
    return streamer.hasPendingDeletion(vm.annotation.id);
  };

  vm.isReply = function () {
    return isReply(vm.annotation);
  };

  vm.links = function () {
    if (vm.annotation.links) {
      return {incontext: vm.annotation.links.incontext ||
                         vm.annotation.links.html ||
                         '',
              html: vm.annotation.links.html};
    } else {
      return {incontext: '', html: ''};
    }
  };

  /**
   * Sets whether or not the controls for expanding/collapsing the body of
   * lengthy annotations should be shown.
   */
  vm.setBodyCollapsible = function (canCollapse) {
    if (canCollapse === vm.canCollapseBody) {
      return;
    }
    vm.canCollapseBody = canCollapse;

    // This event handler is called from outside the digest cycle, so
    // explicitly trigger a digest.
    $scope.$digest();
  };

  vm.setText = function (text) {
    drafts.update(vm.annotation, {
      isPrivate: vm.state().isPrivate,
      tags: vm.state().tags,
      text: text,
      viddata: vm.state().viddata,
      page_data: text,
    });
  };
  vm.setRenoted_id = function (renoted_id) {
    drafts.update(vm.annotation, {
      isPrivate: vm.state().isPrivate,
      tags: tags,
      text: text,
      renoted_id: vm.state().renoted_id,
    });
  };
  vm.setTags = function (tags) {
    drafts.update(vm.annotation, {
      isPrivate: vm.state().isPrivate,
      tags: tags,
      text: vm.state().text,
      viddata: vm.state().viddata,
    });
  
  };


  vm.setStarttime = function (starttime) {
    var val = starttime.split(":");
    var retstarttime=0;
    if (val.length == 2){
        retstarttime = (parseInt(val[0])*60 + parseInt(val[1])).toString();
     }
    if (val.length == 3){
        retstarttime = (parseInt(val[0])*3600 + parseInt(val[1])*60 + parseInt(val[2])).toString();
     }

     if(vm.isVideo()) {

      var viddata=vm.annotation.viddata;
      viddata[0].starttime = retstarttime ;   
      drafts.update(vm.annotation, {
        isPrivate: vm.state().isPrivate,
        tags: vm.state().tags,
        text: vm.state().text,
        viddata: viddata,
      });
    }
    else if(vm.isAudio()) {
      var auddata=vm.annotation.auddata;
      auddata[0].starttime = retstarttime*1000; //Convert to milliseconds for SC
      drafts.update(vm.annotation, {
        isPrivate: vm.state().isPrivate,
        tags: vm.state().tags,
        text: vm.state().text,
        auddata: auddata,
      });
    }   
  };


  vm.setEndtime = function (endtime) {
    var val = endtime.split(":");
    var retendtime=0
    if (val.length == 2){
        retendtime = (parseInt(val[0])*60 + parseInt(val[1])).toString()
     }
    if (val.length == 3){
        retendtime = (parseInt(val[0])*3600 + parseInt(val[1])*60 + parseInt(val[2])).toString()
     }

     if(vm.isVideo()) {

      var viddata=vm.annotation.viddata;

      viddata[0].endtime = retendtime;
      drafts.update(vm.annotation, {
        isPrivate: vm.state().isPrivate,
        tags: vm.state().tags,
        text: vm.state().text,
        viddata: viddata,
      });
    }
    else if(vm.isAudio()) {
      var auddata=vm.annotation.auddata;
      auddata[0].endtime = retendtime*1000; //Convert to milliseconds for SC
      drafts.update(vm.annotation, {
        isPrivate: vm.state().isPrivate,
        tags: vm.state().tags,
        text: vm.state().text,
        auddata: auddata,
      });
    }

  };

  vm.state = function () {
    var draft = drafts.get(vm.annotation);
    if (draft) {
      return draft;
    }
    return {
      tags: vm.annotation.tags,
      text: vm.annotation.text,
      renoted_id: vm.annotation.renoted_id,
      viddata: vm.annotation.viddata,
      page_data: vm.annotation.text,
      isPrivate: permissions.isPrivate(vm.annotation.permissions,
        vm.annotation.user),
    };
  };

  var documentMeta = memoize(annotationMetadata.domainAndTitle);
  vm.documentMeta = function () {
    return documentMeta(vm.annotation);
  };

vm.createVMPlayer = function() {
  var startTime = vm.annotation.viddata[0].starttime;
  var endTime = vm.annotation.viddata[0].endtime;

 // var iframe = document.querySelector(‘iframe’);
  // var player = new Vimeo.Player(iframe);

 var options = {
      id: vm.getVideoId(),
      width: 350
  };

 var player = new Vimeo.Player(vm.getPlayerId(), options);

 var onPlay = function() {
    console.log("Now the video is playing");
    player.setCurrentTime(startTime).then(function(seconds) {})
    
 };

 player.on('play', onPlay);

 var doPause = true;

 var onPlaying = function(e) {

   player.getCurrentTime().then(function(startPoint) {

     if(startPoint < endTime)
        doPause = true;

     //Get the current time of the playback
      if( doPause && startPoint >= endTime)
      {
        player.pause();
        doPause = false;
        player.off('play');
      }

   });

   console.log("the time has updated... DO something " + startPoint);
  };

 player.on('timeupdate', onPlaying);
};  

  init();
}

// @ngInject
function annotation() {
  return {
    restrict: 'E',
    bindToController: true,
    controller: AnnotationController,
    controllerAs: 'vm',
    scope: {
      annotation: '<',
      showDocumentInfo: '<',
      onReplyCountClick: '&',
      replyCount: '<',
      isCollapsed: '<',
    },
    template: require('../../../templates/client/annotation.html'),
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
  directive: annotation,
  Controller: AnnotationController,
};
