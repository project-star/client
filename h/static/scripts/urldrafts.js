'use strict';

/**
 * Return true if a given `urldraft` is empty and can be discarded without losing
 * any user input
 */
function isEmpty(urldraft) {
  if (!urldraft) {
    return true;
  }
  return urldraft.tags.length === 0;
}

/**
 * The urldrafts service provides temporary storage for unsaved edits to new or
 * existing annotations.
 *
 * A draft consists of:
 *
 * 1. `model` which is the original annotation domain model object which the
 *    urldraft is associated with. Domain model objects are never returned from
 *    the urldrafts service, they're only used to identify the correct urldraft to
 *    return.
 *
 * 2. `tags` (array of objects) which is the user's urldraft changes to the annotation. These are returned
 *    from the drafts service by `urldrafts.get()`.
 *
 */
function UrlDraftStore() {
  this._urldrafts = [];

  /**
   * Returns true if 'urldraft' is a urldraft for a given
   * annotation.
   *
   * Annotations are matched by urlID or local tag.
   */
  function match(urldraft, urlmodel) {
    return (urldraft.urlmodel.uri_id && urlmodel.uri_id === urldraft.urlmodel.uri_id) ||
    (urldraft.urlmodel.$$tag && urlmodel.$$tag === urldraft.urlmodel.$$tag)
  }

  /**
   * Returns the number of drafts - both unsaved new annotations, and unsaved
   * edits to saved annotations - currently stored.
   */
  this.count = function count() {
    return this._urldrafts.length;
  };

  /**
   * Returns a list of local tags of new annotations for which unsaved drafts
   * exist.
   *
   * @return {Array<{$$tag: string}>}
   */
  this.unsaved = function unsaved() {
    return this._urldrafts.filter(function(urldraft) {
      return !urldraft.urlmodel.uri_id;
    }).map(function(urldraft) {
      return urldraft.urlmodel;
    });
  };

  /** Retrieve the draft changes for an annotation. */
  this.get = function get(urlmodel) {
    for (var i = 0; i < this._urldrafts.length; i++) {
      var urldraft = this._urldrafts[i];
      if (match(urldraft, urlmodel)) {
        return {
          tags: urldraft.tags,
        };
      }
    }
    return null;
  };

  /**
   * Returns the draft changes for an annotation, or null if no draft exists
   * or the draft is empty.
   */
  this.getIfNotEmpty = function (urlmodel) {
    var urldraft = this.get(urlmodel);
    return isEmpty(urldraft) ? null : urldraft;
  };

  /**
   * Update the draft version for a given annotation, replacing any
   * existing draft.
   */
  this.urlupdate = function urlupdate(urlmodel, changes) {
    var newurlDraft = {
      urlmodel: {uri_id: urlmodel.uri_id, $$tag: urlmodel.$$tag},
      tags: changes.tags,
    };
    //this.remove(urlmodel);
    //this._urldrafts.push(newurlDraft);
  };

  /** Remove the draft version of an annotation. */
  this.remove = function remove(urlmodel) {
    this._urldrafts = this._urldrafts.filter(function(urldraft) {
      return !match(urldraft, urlmodel);
    });
  };

  /** Remove all drafts. */
  this.discard = function discard() {
    this._urldrafts = [];
  };
}

module.exports = function() {
  return new UrlDraftStore();
};
