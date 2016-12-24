'use strict';

/**
 * This module defines the main update function (or 'reducer' in Redux's
 * terminology) that handles app state updates. For an overview of how state
 * management in Redux works, see the comments at the top of `annotation-ui.js`
 *
 * Each sub-module in this folder defines:
 *
 *  - An `init` function that returns the initial state relating to some aspect
 *    of the application
 *  - An `update` object mapping action types to a state update function for
 *    that action
 *  - A set of action creators - functions that return actions that can then
 *    be passed to `store.dispatch()`
 *  - A set of selectors - Utility functions that calculate some derived data
 *    from the state
 */

var annotations = require('./annotations');
var selection = require('./selection');
var urlselection = require('./urlselection');
var viewer = require('./viewer');
var util = require('./util');
var urls = require('./urls');
function init(settings) {
  return Object.assign(
    {},
    annotations.init(),
    urls.init(),
    selection.init(settings),
    urlselection.init(settings),
    viewer.init()
  );
}

var update = util.createReducer(Object.assign(
  urls.update,
  annotations.update,
  selection.update,
  urlselection.update,
  viewer.update
));

module.exports = {
  init: init,
  update: update,
};
