'use strict';

module.exports = function () {
  return {
    controller: function () {},
    restrict: 'E',
    scope: {
      auth: '<',
      isSidebar: '<',
      onShowHelpPanel: '&',
      switchMainTab: '&',
      onLogin: '&',
      onLogout: '&',
      onSharePage: '&',
      searchController: '<',
      accountDialog: '<',
      shareDialog: '<',
      sortKey: '<',
      sortKeysAvailable: '<',
      onChangeSortKey: '&',
      pendingUpdateCount: '<',
      onApplyPendingUpdates: '&',
      sidebarSearchController: '<',
    },
    template: require('../../../templates/client/top_bar.html'),
  };
};
