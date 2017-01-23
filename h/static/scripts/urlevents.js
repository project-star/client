'use strict';

/**
 * This module defines the set of global events that are dispatched
 * on $rootScope
 */
module.exports = {
  // Session state changes

  /** The list of groups changed */
  GROUPS_CHANGED: 'groupsChanged',
  /** The logged-in user changed */
  USER_CHANGED: 'userChanged',
  /**
   * The session state was updated.
   */
  SESSION_CHANGED: 'sessionChanged',

  // UI state changes

  /** The currently selected group changed */
  GROUP_FOCUSED: 'groupFocused',

  // Annotation events

  /** A new annotation has been created locally. */
  BEFORE_URL_CREATED: 'beforeUrlCreated',




  /** An annotation has been updated. */
  URL_UPDATED: 'urlUpdated',

  /** A set of annotations were loaded from the server. */
  URLS_LOADED: 'urlsLoaded',

  /** An annotation is unloaded. */
  URLS_UNLOADED: 'urlsUnloaded',
 
  /** An annotation was either deleted or unloaded. */
  URL_DELETED: 'urlDeleted',

};
