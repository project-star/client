'use strict';

// @ngInject
function VideoTimeEditorController(starttime,endtime) {
  this.onTimeChanged = function () {
    console.log(starttime)
    console.log(endtime)
    starttime.store(this.starttime);
    endtime.store(this.endtime)
    var newstarttime = this.starttime.map(function (item) { return item.text; });
    var newendtime = this.endtime.map(function (item) { return item.text; });
    this.onEditVideoTime({starttime: newstarttime, endtime: newendtime});
  };


  this.$onChanges = function (changes) {
    if (changes.starttime) {
      this.starttime = changes.starttime.currentValue.map(function (starttime) {
        return {text: starttime};
      });
     }
      if (changes.endtime) {
      this.endtime = changes.endtime.currentValue.map(function (endtime) {
        return {text: endtime};
      });

    }
  };
}

module.exports = function () {
  return {
    bindToController: true,
    controller: VideoTimeEditorController,
    controllerAs: 'vm',
    restrict: 'E',
    scope: {
      starttime: '<',
      endtime: '<',
      onEditVideoTime: '&',
    },
    template: require('../../../templates/client/videotime_editor.html'),
  };
};
