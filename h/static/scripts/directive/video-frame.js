'use strict';
module.exports = function () {
  return {
    
    bindToController: true,
    controllerAs: 'vm',
    
    //@ngInject
    controller: function ($scope,store,urlUI) {
    var self=this;
    this.check = false;
    this.iframeId = function(){
     // var val = document.getElementsByTagName('iframe')
      return false
    }

    },
    restrict: 'E',
    template: require('../../../templates/client/video_frame.html'),
  };
};
