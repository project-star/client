'use strict';

var uiConstants = require('../ui-constants');

module.exports = function () {
   return {
    bindToController: true,
    controllerAs: 'vm',
    //@ngInject
    controller: function ($element, annotationUI, features) {
      this.TAB_OWN_ANNOTATIONS = 'ownannotation';
      this.TAB_SHARED_ANNOTATIONS = 'sharedannotation';

      this.selectTab = function (type) {
        annotationUI.clearSelectedAnnotations()
        annotationUI.selectSharedTab(type);
      };
      this.switchAnnotationView = function (type) {
        switchAnnotationTab(type);
      };
   },
    restrict: 'E',
    scope: {
      isLoading: '<',
      isWaitingToAnchorAnnotations: '<',
      selectedTab: '<',
      selectedSharedTab: '<',
      gotoSearchSelection: '&',
      switchAnnotationTab: '&',
      totalAnnotations: '<',
      totalNotes: '<',
      totalOrphans: '<',
      totalSharedAnnotations: '<',
      totalOwnAnnotations: '<',
    },
    template: require('../../../templates/client/share_selection_tabs.html'),
  };
};
