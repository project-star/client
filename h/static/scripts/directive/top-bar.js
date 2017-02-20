'use strict';

module.exports = function () {
  return {
    controller: function () {

    },
    restrict: 'E',
    scope: {
      auth: '<',
      isSidebar: '<',
      onShowHelpPanel: '&',
      onLogin: '&',
      onLogout: '&',
      onSharePage: '&',
      onSharedStream: '<',
      searchController: '<',
      accountDialog: '<',
      shareDialog: '<',
      sortKey: '<',
      selectedUrlFilterKey: '<',
      sortKeysAvailable: '<',
      onChangeSortKey: '&',
      setUrlFilterKeyAll: '&',
      setUrlFilterKeyText: '&',
      setUrlFilterKeyVideo: '&',
      setUrlFilterKeyAudio: '&',
      pendingUpdateCount: '<',
      onApplyPendingUpdates: '&',
      toggleLeftNav: '&',
      leftNavVisible: '=',
    },
    template: require('../../../templates/client/top_bar.html'),
  };
};
