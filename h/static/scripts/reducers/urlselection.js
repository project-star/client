/**
 * This module handles state related to the current sort, search and filter
 * settings in the UI, including:
 *
 * - The set of annotations that are currently focused (hovered) or selected
 * - The selected tab
 * - The current sort order
 * - The current filter query
 */

'use strict';

var immutable = require('seamless-immutable');

var uiConstants = require('../ui-constants');

var util = require('./util');

/**
* Default starting tab.
*/
var TAB_DEFAULT = uiConstants.TAB_ANNOTATIONS;

 /**
  * Default sort keys for each tab.
  */
var TAB_SORTKEY_DEFAULT = {};
TAB_SORTKEY_DEFAULT[uiConstants.TAB_ANNOTATIONS] = 'Location';
TAB_SORTKEY_DEFAULT[uiConstants.TAB_NOTES] = 'Oldest';
TAB_SORTKEY_DEFAULT[uiConstants.TAB_ORPHANS] = 'Location';

/**
 * Available sort keys for each tab.
 */
var TAB_SORTKEYS_AVAILABLE = {};
TAB_SORTKEYS_AVAILABLE[uiConstants.TAB_ANNOTATIONS] = ['Newest', 'Oldest', 'Location', 'Relevance', 'Oldest Created', 'Newest Created'];
TAB_SORTKEYS_AVAILABLE[uiConstants.TAB_NOTES] = ['Newest', 'Oldest', 'Relevance', 'Newest Created', 'Oldest Created'];
TAB_SORTKEYS_AVAILABLE[uiConstants.TAB_ORPHANS] = ['Newest', 'Oldest', 'Location', 'Relevance', 'Oldest Created', 'Newest Created'];


var URL_FILTER_KEYS_AVAILABLE = ['all','text','video','audio'];

var URL_FILTER_DEFAULT = 'all';

var URL_STACK_DEFAULT = 'serversideaddedstack';

function initialSelection(settings) {
  var selection = {};
  if (settings.urls) {
    selection[settings.urls] = true;
  }
  return freeze(selection);
}

function freeze(selection) {
  if (Object.keys(selection).length) {
    return immutable(selection);
  } else {
    return null;
  }
}

function toSet(list) {
  return list.reduce(function (set, key) {
    set[key] = true;
    return set;
  }, {});
}

function init(settings) {
  return {
    // Contains a map of annotation tag:true pairs.
    focusedUrlMap: null,

    // Contains a map of annotation id:true pairs.
    selectedUrlMap: initialSelection(settings),

    // Map of annotation IDs to expanded/collapsed state. For annotations not
    // present in the map, the default state is used which depends on whether
    // the annotation is a top-level annotation or a reply, whether it is
    // selected and whether it matches the current filter.
    expanded: initialSelection(settings) || {},

    // Set of IDs of annotations that have been explicitly shown
    // by the user even if they do not match the current search filter
    forceVisible: {},

    // IDs of annotations that should be highlighted
    highlighted: [],

    filterQuery: null,

    selectedTab: TAB_DEFAULT,
    selectedUrlFilterKey: URL_FILTER_DEFAULT,
    selectedUrlStackKey:  URL_STACK_DEFAULT,
    // Key by which annotations are currently sorted.
    sortKey: TAB_SORTKEY_DEFAULT[TAB_DEFAULT],
    // Keys by which annotations can be sorted.
    sortKeysAvailable: TAB_SORTKEYS_AVAILABLE[TAB_DEFAULT],
  };
}

var update = {
  CLEAR_SELECTION: function () {
    return {filterQuery: null, selectedUrlMap: null};
  },

  SELECT_URLS: function (state, action) {
    return {selectedUrlMap: action.selection};
  },

  FOCUS_URLS: function (state, action) {
    return {focusedUrlMap: action.focused};
  },

  SET_FORCE_VISIBLE: function (state, action) {
    return {forceVisible: action.forceVisible};
  },

  SET_EXPANDED: function (state, action) {
    return {expanded: action.expanded};
  },

  HIGHLIGHT_URLS: function (state, action) {
    return {highlighted: action.highlighted};
  },

  SELECT_TAB: function (state, action) {
    // Do nothing if the "new tab" is not a valid tab.
    if ([uiConstants.TAB_ANNOTATIONS,
        uiConstants.TAB_NOTES,uiConstants.TAB_RECALL,
        uiConstants.TAB_ORPHANS].indexOf(action.tab) === -1) {
      return {};
    }
    // Shortcut if the tab is already correct, to avoid resetting the sortKey
    // unnecessarily.
    if (state.selectedTab === action.tab) {
      return {};
    }
    return {
      selectedTab: action.tab,
      sortKey: TAB_SORTKEY_DEFAULT[action.tab],
      sortKeysAvailable: TAB_SORTKEYS_AVAILABLE[action.tab],
    };
  },

  SET_FILTER_QUERY: function (state, action) {
    return {
      filterQuery: action.query,
      forceVisible: {},
      expanded: {},
    };
  },

  SET_SORT_KEY: function (state, action) {
    return {sortKey: action.key};
  },

  SET_URL_FILTER_KEY: function (state, action) {
    return {selectedUrlFilterKey: action.key};
  },

  SET_URL_STACK_KEY: function (state, action) {
    return {selectedUrlStackKey: action.key};
  },
};

var actions = util.actionTypes(update);

function select(urls) {
  return {
    type: actions.SELECT_URLS,
    selection: freeze(urls),
  };
}

/**
 * Set the currently selected annotation IDs.
 */
function selectUrls(ids) {
  return select(toSet(ids));
}

/** Toggle whether annotations are selected or not. */
function toggleSelectedUrls(ids) {
  return function (dispatch, getState) {
    var selection = Object.assign({}, getState().selectedUrlMap);
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (selection[id]) {
        delete selection[id];
      } else {
        selection[id] = true;
      }
    }
    dispatch(select(selection));
  };
}

/**
 * Sets whether a given annotation should be visible, even if it does not
 * match the current search query.
 *
 * @param {string} id - Annotation ID
 * @param {boolean} visible
 */
function setForceVisible(id, visible) {
  // FIXME: This should be converted to a plain action and accessing the state
  // should happen in the update() function
  return function (dispatch, getState) {
    var forceVisible = Object.assign({}, getState().forceVisible);
    forceVisible[id] = visible;
    dispatch({
      type: actions.SET_FORCE_VISIBLE,
      forceVisible: forceVisible,
    });
  };
}

/**
 * Sets which annotations are currently focused.
 *
 * @param {Array<string>} Tags of annotations to focus
 */
function focusUrls(tags) {
  return {
    type: actions.FOCUS_URLS,
    focused: freeze(toSet(tags)),
  };
}

function setCollapsed(id, collapsed) {
  // FIXME: This should be converted to a plain action and accessing the state
  // should happen in the update() function
  return function (dispatch, getState) {
    var expanded = Object.assign({}, getState().expanded);
    expanded[id] = !collapsed;
    dispatch({
      type: actions.SET_EXPANDED,
      expanded: expanded,
    });
  };
}

/**
 * Highlight annotations with the given `ids`.
 *
 * This is used to indicate the specific annotation in a thread that was
 * linked to for example.
 */
function highlightUrls(ids) {
  return {
    type: actions.HIGHLIGHT_URLS,
    highlighted: ids,
  };
}


/** Set the type annotations to be displayed. */
function selectTab(type) {
  return {
    type: actions.SELECT_TAB,
    tab: type,
  };
}

function setUrlFilterKey(key) {
  return {
    type: actions.SET_URL_FILTER_KEY,
    key: key,
  };
}

function setUrlStackKey(key) {
  return {
    type: actions.SET_URL_STACK_KEY,
    key: key,
  };
}

/** Set the query used to filter displayed annotations. */
function setFilterQuery(query) {
  return {
    type: actions.SET_FILTER_QUERY,
    query: query,
  };
}

/** Sets the sort key for the annotation list. */
function setSortKey(key) {
  return {
    type: actions.SET_SORT_KEY,
    key: key,
  };
}

/**
 * Returns true if the annotation with the given `id` is selected.
 */
function isUrlSelected(state, id) {
  return (state.selectedUrlMap || {}).hasOwnProperty(id);
}

/**
 * Return true if any annotations are currently selected.
 */
function hasSelectedUrls(state) {
  return !!state.selectedUrlMap;
}

/** De-select an annotation. */
function removeSelectedUrl(id) {
  // FIXME: This should be converted to a plain action and accessing the state
  // should happen in the update() function
  return function (dispatch, getState) {
    var selection = Object.assign({}, getState().selectedUrlMap);
    if (!selection || !id) {
      return;
    }
    delete selection[id];
    dispatch(select(selection));
  };
}

/** De-select all annotations. */
function clearSelectedUrls() {
  return {type: actions.CLEAR_SELECTION};
}

module.exports = {
  init: init,
  update: update,

  actions: {
    clearSelectedUrls: clearSelectedUrls,
    focusUrls: focusUrls,
    highlightUrls: highlightUrls,
    removeSelectedUrl: removeSelectedUrl,
    selectUrls: selectUrls,
    selectTab: selectTab,
    setCollapsed: setCollapsed,
    setFilterQuery: setFilterQuery,
    setForceVisible: setForceVisible,
    setSortKey: setSortKey,
    setUrlFilterKey: setUrlFilterKey,
    setUrlStackKey: setUrlStackKey,
    toggleSelectedUrls: toggleSelectedUrls,
  },

  // Selectors
  hasSelectedUrls: hasSelectedUrls,
  isUrlSelected: isUrlSelected,
};
