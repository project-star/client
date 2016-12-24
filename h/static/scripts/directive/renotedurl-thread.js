'use strict';

function hiddenCount(thread) {
  var isHidden = !thread.visible;
  return thread.children.reduce(function (count, reply) {
    return count + hiddenCount(reply);
  }, isHidden ? 1 : 0);
}

function visibleCount(thread) {
  var isVisible = thread.visible;
  return thread.children.reduce(function (count, reply) {
    return count + visibleCount(reply);
  }, isVisible ? 1 : 0);
}

function showAllChildren(thread, showFn) {
  thread.children.forEach(function (child) {
    showFn({thread: child});
    showAllChildren(child, showFn);
  });
}

function showAllParents(thread, showFn) {
  while (thread.parent && thread.parent.url) {
    showFn({thread: thread.parent});
    thread = thread.parent;
  }
}

// @ngInject
function RenotedUrlThreadController() {
  // Flag that tracks whether the content of the annotation is hovered,
  // excluding any replies.
  this.urlHovered = false;
  
  this.toggleCollapsed = function () {
    this.onChangeCollapsed({
      id: this.thread.id,
      collapsed: !this.thread.collapsed,
    });
  };

  this.threadClasses = function () {
    return {
      'renotedurl-thread': true,
      'renotedurl-thread--reply': this.thread.depth > 0,
      'renotedurlthread--top-reply': this.thread.depth === 1,
    };
  };

  this.threadToggleClasses = function () {
    return {
      'renotedurl-thread__collapse-toggle': true,
      'is-open': !this.thread.collapsed,
      'is-hovered': this.annotationHovered,
    };
  };

  this.urlClasses = function () {
    return {
      url: true,
      'url--reply': this.thread.depth > 0,
      'is-collapsed': this.thread.collapsed,
      'is-highlighted': this.thread.highlightState === 'highlight',
      'is-dimmed': this.thread.highlightState === 'dim',
    };
  };

  /**
   * Show this thread and any of its children
   */
  this.showThreadAndReplies = function () {
    showAllParents(this.thread, this.onForceVisible);
    this.onForceVisible({thread: this.thread});
    showAllChildren(this.thread, this.onForceVisible);
  };

  this.isTopLevelThread = function () {
    return !this.thread.parent;
  };

  /**
   * Return the total number of annotations in the current
   * thread which have been hidden because they do not match the current
   * search filter.
   */
  this.hiddenCount = function () {
    return hiddenCount(this.thread);
  };

  this.shouldShowReply = function (child) {
    return visibleCount(child) > 0;
  };
}

/**
 * Renders a thread of annotations.
 */
module.exports = function () {
  return {
    restrict: 'E',
    bindToController: true,
    controllerAs: 'vm',
    controller: RenotedUrlThreadController,
    scope: {
      /** The annotation thread to render. */
      thread: '<',
      /**
       * Specify whether document information should be shown
       * on annotation cards.
       */
      showDocumentInfo: '<',
      /** Called when the user clicks on the expand/collapse replies toggle. */
      onChangeCollapsed: '&',
      /**
       * Called when the user clicks the button to show this thread or
       * one of its replies.
       */
      onForceVisible: '&',
    },
    template: require('../../../templates/client/renotedurl_thread.html'),
  };
};
