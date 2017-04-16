'use strict';
var urlevents = require('../urlevents');
module.exports = function () {
  return {
    
    bindToController: true,
    controllerAs: 'vm',
    
    //@ngInject
    controller: function (store,urlUI,$rootScope) {

      var self=this;
      var currentStackFilter = urlUI.getState().selectedUrlStackKey;
      this.isEditing=false;
      this.newName="";

      this.prunedStackName = function() {
        var prunedName = this.archivedName;
        if (this.archivedName.length > 18) {
          prunedName = this.archivedName.slice(0, 18) + '…';
        }
        return prunedName;        
      };

      this.dearchiveStack = function() {
          //TODO:
          //Make API call to delete the stack
          //On success remove the stackname from the kStackList
          var toSendStack = []
          toSendStack.push(self.archivedName)
          var payload = {"stacks":toSendStack};

          var result = store.onTopDearchive({}, payload);
          result.then(function(response) {

            var index = self.archivedList.indexOf(self.archivedName);
            urlUI.addToAvailableStackList(self.archivedName);
            urlUI.removeFromArchivedStackList(self.archivedName);                 
            if( index > -1)
              self.archivedList.splice(index, 1);  
            var eventdata={}
            eventdata["stackname"] = self.archivedName
            $rootScope.$broadcast(urlevents.STACK_DEARCHIVED, eventdata);

          }, function(failure) {

          });
       
      };     
     
    },
    restrict: 'E',
    scope: {
      archivedName: '<',
      archivedList: '=',
      visible: '<'
    },
    template: require('../../../templates/client/archive_item.html'),
  };
};
