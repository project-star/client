/**
 * State management for the set of annotations currently loaded into the
 * sidebar.
 */

'use strict';

var arrayUtil = require('../util/array-util');
var metadata = require('../annotation-metadata');
var uiConstants = require('../ui-constants');

var selection = require('./urlselection');
var util = require('./util');

/**
 * Return a copy of `current` with all matching annotations in `annotations`
 * removed.
 */
function excludeUrls(current, urls) {
  var ids = {};
  var tags = {};
  urls.forEach(function (url) {
    if (url.id) {
      ids[url.id] = true;
    }
    if (url.$$tag) {
      tags[url.$$tag] = true;
    }
  });
  return current.filter(function (url) {
    var shouldRemove = (url.id && (url.id in ids)) ||
                       (url.$$tag && (url.$$tag in tags));
    return !shouldRemove;
  });
}

function findByID(urls, id) {
  return urls.find(function (url) {
    return url.id === id;
  });
}

function findByTag(urls, tag) {
  return urls.find(function (url) {
    return url.$$tag === tag;
  });
}

/**
 * Initialize the status flags and properties of a new annotation.
 */
function initializeUrl(url, tag) {


  return Object.assign({}, url, {
    $$tag: url.$$tag || tag,
  });
}

function init() {
  return {
    urls: [],

    // The local tag to assign to the next annotation that is loaded into the
    // app
    nextTag: 1,
  };
}

var update = {
  ADD_URLS: function (state, action) {
    var updatedIDs = {};
    var updatedTags = {};

    var added = [];
    var unchanged = [];
    var updated = [];
    var nextTag = state.nextTag;

    action.urls.forEach(function (url) {
      var existing;
      if (url.id) {
        existing = findByID(state.urls, url.id);
      }
      if (!existing && url.$$tag) {
        existing = findByTag(state.urls, url.$$tag);
      }

      if (existing) {
        // Merge the updated annotation with the private fields from the local
        // annotation
        updated.push(Object.assign({}, existing, url));
        if (url.id) {
          updatedIDs[url.id] = true;
        }
        if (existing.$$tag) {
          updatedTags[existing.$$tag] = true;
        }
      } else {
        added.push(initializeUrl(url, 't' + nextTag));
        ++nextTag;
      }
    });

    state.urls.forEach(function (url) {
      if (!updatedIDs[url.id] && !updatedTags[url.$$tag]) {
        unchanged.push(url);
      }
    });
    return {
      urls: added.concat(updated).concat(unchanged),
      nextTag: nextTag,
    };
  },

  REMOVE_URLS: function (state, action) {
    var urlalls = excludeUrls(state.urls, action.urls);
    var selectedTab = state.selectedTab;
//    if (selectedTab === uiConstants.TAB_ORPHANS &&
//        arrayUtil.countIf(urlalls, metadata.isOrphan) === 0) {
//      selectedTab = uiConstants.TAB_ANNOTATIONS;
//    }

    var tabUpdateFn = selection.update.SELECT_TAB;
    return Object.assign(
      {urls: urlalls},
      tabUpdateFn(state, selection.actions.selectTab(selectedTab))
    );
  },

  CLEAR_URLS: function () {
    return {urls: []};
  },

  UPDATE_ANCHOR_STATUS: function (state, action) {
    var urls = state.urls.map(function (url) {
      var match = (url.id && url.id === action.id) ||
                  (url.$$tag && url.$$tag === action.tag);
      if (match) {
        return Object.assign({}, url, {
          $$tag: action.tag,
        });
      } else {
        return url;
      }
    });
    return {urls: urls};
  },
};

var actions = util.actionTypes(update);

/** Add annotations to the currently displayed set. */
function addUrls(urls, now) {
  now = now || new Date();
  // Add dates to new annotations. These are ignored by the server but used
  // when sorting unsaved annotation cards.
  urls = urls.map(function (url) {
    if (url.id) { return url; }
    return Object.assign({
      // Copy $$tag explicitly because it is non-enumerable.
      //
      // FIXME: change $$tag to $tag and make it enumerable so annotations
      // can be handled more simply in the sidebar.
      $$tag: url.$$tag,
      // Date.prototype.toISOString returns a 0-offset (UTC) ISO8601
      // datetime.
      created: now.toISOString(),
      updated: now.toISOString(),
    }, url);
  });

  return function (dispatch, getState) {
    var added = urls.filter(function (url) {
      return !findByID(getState().urls, url.id);
    });

    dispatch({
      type: actions.ADD_URLS,
      urls: urls,
    });
    if (!getState().isSidebar) {
      return;
    }

    // If anchoring fails to complete in a reasonable amount of time, then
    // we assume that the annotation failed to anchor. If it does later
    // successfully anchor then the status will be updated.
    var ANCHORING_TIMEOUT = 500;

    var anchoringUrls = added.filter(metadata.isWaitingToAnchor);
    if (anchoringUrls.length) {
      setTimeout(function () {
        arrayUtil
          .filterMap(anchoringUrls, function (url) {
            return findByID(getState().urls, url.id);
          })
          .filter(metadata.isWaitingToAnchor)
      }, ANCHORING_TIMEOUT);
    }
  };
}

/** Remove annotations from the currently displayed set. */
function removeUrls(urls) {
  return {
    type: actions.REMOVE_URLS,
    urls: urls,
  };
}

/** Set the currently displayed annotations to the empty set. */
function clearUrls() {
  return {type: actions.CLEAR_URLS};
}

/**
 * Updating the local tag and anchoring status of an annotation.
 *
 * @param {string|null} id - Annotation ID
 * @param {string} tag - The local tag assigned to this annotation to link
 *        the object in the page and the annotation in the sidebar
 * @param {boolean} isOrphan - True if the annotation failed to anchor
 */
function updateAnchorStatus(id, tag) {
  return {
    type: actions.UPDATE_ANCHOR_STATUS,
    id: id,
    tag: tag,
  };
}

/**
 * Return all loaded annotations which have been saved to the server.
 *
 * @param {state} - The global app state
 */
//function savedUrls(state) {
//  return state.urls.filter(function (ur) {
 //   return !metadata.isNew(ur);
//  });
//}

/** Return true if the annotation with a given ID is currently loaded. */
function urlExists(state, id) {
  return state.urls.some(function (url) {
    return url.id === id;
  });
}

module.exports = {
  init: init,
  update: update,
  actions: {
    addUrls: addUrls,
    clearUrls: clearUrls,
    removeUrls: removeUrls,
    updateAnchorStatus: updateAnchorStatus,
  },

  // Selectors
  urlExists: urlExists,
//  savedUrls: savedUrls,
};
