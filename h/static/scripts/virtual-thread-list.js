'use strict';

var EventEmitter = require('tiny-emitter');
var debounce = require('lodash.debounce');
var inherits = require('inherits');

/**
 * VirtualThreadList is a helper for virtualizing the annotation thread list.
 *
 * 'Virtualizing' the thread list improves UI performance by only creating
 * annotation cards for annotations which are either in or near the viewport.
 *
 * Reducing the number of annotation cards that are actually created optimizes
 * the initial population of the list, since annotation cards are big components
 * that are expensive to create and consume a lot of memory. For Angular
 * applications this also helps significantly with UI responsiveness by limiting
 * the number of watchers (functions created by template expressions or
 * '$scope.$watch' calls) that have to be run on every '$scope.$digest()' cycle.
 *
 * @param {Window} container - The Window displaying the list of annotation threads.
 * @param {Thread} rootThread - The initial Thread object for the top-level
 *        threads.
 */
function VirtualThreadList($scope, window_, rootThread) {
  var self = this;

  this._rootThread = rootThread;

  // Cache of thread ID -> last-seen height
  this._heights = {};

  this.window = window_;

  var debouncedUpdate = debounce(function () {
    self._updateVisibleThreads();
    $scope.$digest();
  }, 20);
  this.window.addEventListener('scroll', debouncedUpdate);
  this.window.addEventListener('resize', debouncedUpdate);

  this._detach = function () {
    this.window.removeEventListener('scroll', debouncedUpdate);
    this.window.removeEventListener('resize', debouncedUpdate);
  };
}
inherits(VirtualThreadList, EventEmitter);

/**
 * Detach event listeners and clear any pending timeouts.
 *
 * This should be invoked when the UI view presenting the virtual thread list
 * is torn down.
 */
VirtualThreadList.prototype.detach = function () {
  this._detach();
};

/**
 * Sets the root thread containing all conversations matching the current
 * filters.
 *
 * This should be called with the current Thread object whenever the set of
 * matching annotations changes.
 */
VirtualThreadList.prototype.setRootThread = function (thread) {
  if (thread === this._rootThread) {
    return;
  }
  this._rootThread = thread;
  this._updateVisibleThreads();
};

/**
 * Sets the actual height for a thread.
 *
 * When calculating the amount of space required for offscreen threads,
 * the actual or 'last-seen' height is used if known. Otherwise an estimate
 * is used.
 *
 * @param {string} id - The annotation ID or $$tag
 * @param {number} height - The height of the annotation thread.
 */
VirtualThreadList.prototype.setThreadHeight = function (id, height) {
  if (isNaN(height) || height <= 0) {
    throw new Error('Invalid thread height %d', height);
  }
  this._heights[id] = height;
};

VirtualThreadList.prototype._height = function (id) {
  // Default guess of the height required for a threads that have not been
  // measured
  var DEFAULT_HEIGHT = 500;
  return this._heights[id] || DEFAULT_HEIGHT;
};

/** Return the vertical offset of an annotation card from the top of the list. */
VirtualThreadList.prototype.yOffsetOf = function (id) {
  var self = this;
  var allThreads = this._rootThread.children;
  var matchIndex = allThreads.findIndex(function (thread) {
    return thread.id === id;
  });
  if (matchIndex === -1) {
    return 0;
  }
  return allThreads.slice(0, matchIndex).reduce(function (offset, thread) {
    return offset + self._height(thread.id);
  }, 0);
};

/**
 * Recalculates the set of visible threads and estimates of the amount of space
 * required for offscreen threads above and below the viewport.
 *
 * Emits a `changed` event with the recalculated set of visible threads.
 */
VirtualThreadList.prototype._updateVisibleThreads = function () {
  // Space above the viewport in pixels which should be considered 'on-screen'
  // when calculating the set of visible threads
  var MARGIN_ABOVE = 800;
  // Same as MARGIN_ABOVE but for the space below the viewport
  var MARGIN_BELOW = 800;

  // Estimated height in pixels of annotation cards which are below the
  // viewport and not actually created. This is used to create an empty spacer
  // element below visible cards in order to give the list's scrollbar the
  // correct dimensions.
  var offscreenLowerHeight = 0;
  // Same as offscreenLowerHeight but for cards above the viewport.
  var offscreenUpperHeight = 0;
  // List of annotations which are in or near the viewport and need to
  // actually be created.
  var visibleThreads = [];

  var allThreads = this._rootThread.children;
  var visibleHeight = this.window.innerHeight;
  var usedHeight = 0;
  var thread;
  var urllist=[]
  var newurllist=[]
  var newallThreads = []
  for (var i = 0; i < allThreads.length; i++) {
      thread=allThreads[i];
      console.log("++++in first for loop virtual thread list++++")

      console.log(thread.annotation.uri_id)
      if (urllist.indexOf(thread.annotation.uri_id) == -1){
          thread.annotation.type="first";
          urllist.push(thread.annotation.uri_id);
       }
      else {
          thread.annotation.type="second";
      }
   }
  
  for (var j = 0; j < urllist.length; j++){
    var  urllistval =  urllist[j];
    var medievalallThreads=[]
    for (var i = 0; i < allThreads.length; i++) {
      thread=allThreads[i];
      if (urllistval == thread.annotation.uri_id){
            medievalallThreads.push(thread)
      }
     }
    var sortArr = []
    var sortval = {};
    for (var k=0; k < medievalallThreads.length; k++){
        sortval={}
        thread=medievalallThreads[k];
        if (thread.annotation.target[0].hasOwnProperty("selector")){
           var selector = thread.annotation.target[0].selector;
           for (var m=0; m<selector.length; m++){
               if (selector[m].type=="TextPositionSelector"){
                var startposition = selector[m].start;
                }
             }
           }
         else { var startposition= 0;}
       sortval.key=thread.annotation.id
       sortval.value=startposition
       sortArr.push(sortval)
  }
    console.log("+++in extended virtualthreadlist+++++")
    console.log(sortArr)
    sortArr.sort(function(a, b) { return a.value - b.value; });
    console.log("+++in extended virtualthreadlist+++++")
    console.log(sortArr)
    console.log(urllist)
    
    for (var m=0; m< sortArr.length; m++) {
         for (var k=0; k < medievalallThreads.length; k++){
         if (sortArr[m].key == medievalallThreads[k].annotation.id){ 
             if (newurllist.indexOf(medievalallThreads[k].annotation.uri_id) == -1){
          medievalallThreads[k].annotation.type="first";
          newurllist.push(medievalallThreads[k].annotation.uri_id);
       }
      else {
          medievalallThreads[k].annotation.type="second";
      }
      newallThreads.push(medievalallThreads[k])

   }
   }

   }

   }
    

  for (var i = 0; i < newallThreads.length; i++) {
    thread = newallThreads[i];
    console.log("++++in virtual thread list++++")
    
    console.log(thread)
    var threadHeight = this._height(thread.id);

    if (usedHeight + threadHeight < this.window.pageYOffset - MARGIN_ABOVE) {
      // Thread is above viewport
      offscreenUpperHeight += threadHeight;
    } else if (usedHeight <
      this.window.pageYOffset + visibleHeight + MARGIN_BELOW) {
      // Thread is either in or close to the viewport
      visibleThreads.push(newallThreads[i]);
    } else {
      // Thread is below viewport
      offscreenLowerHeight += threadHeight;
    }

    usedHeight += threadHeight;
  }

  this.emit('changed', {
    offscreenLowerHeight: offscreenLowerHeight,
    offscreenUpperHeight: offscreenUpperHeight,
    visibleThreads: visibleThreads,
  });
};

module.exports = VirtualThreadList;
