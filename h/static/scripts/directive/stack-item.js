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
        var prunedName = this.stackName;
        if (this.stackName.length > 18) {
          prunedName = this.stackName.slice(0, 18) + '…';
        }
        return prunedName;        
      };

      this.cancelEditing = function() {

        urlUI.setUrlStackKey(currentStackFilter)
        this.isEditing=false;
        this.newName="";
      };

      this.replaceStackName = function() {

          //TODO:
          //Make API call
          var payload = {"oldname": self.stackName,
                          "newname":self.newName};
          var currentStackFilter = urlUI.getState().selectedUrlStackKey;
          var result = store.stack.edit({}, payload);
        //On success
        result.then(function(response) {
          urlUI.addToAvailableStackList(self.newName)
          urlUI.removeFromAvailableStackList(self.stackName);
          if (currentStackFilter == self.stackName){
                 urlUI.setUrlStackKey(self.newName)
             }
             else{
                  urlUI.setUrlStackKey(currentStackFilter)
             }
          var index = self.stackList.indexOf(self.stackName);
          if( index > -1)
            self.stackList[index]=self.newName;
          var eventdata={}
          eventdata["oldstackname"] = self.stackName
          eventdata["newstackname"] = self.newName                      
          $rootScope.$broadcast(urlevents.STACK_EDITED, eventdata);

          //self.newName="";
          self.isEditing=false;

        }, function(failure) {
            //On failure
            //self.newName="";
            self.isEditing=false;

        });
        
      };


      this.deleteStack = function() {
          //TODO:
          //Make API call to delete the stack
          //On success remove the stackname from the kStackList
          var currentStackFilter = urlUI.getState().selectedUrlStackKey;
          var payload = {"name":self.stackName};

          var result = store.stack.delete({}, payload);
          result.then(function(response) {

            var index = self.stackList.indexOf(self.stackName);
            urlUI.removeFromAvailableStackList(self.stackName);
            if (currentStackFilter == self.stackName){
                 urlUI.setUrlStackKey("serversideaddedstack")
             }
             else{
                  urlUI.setUrlStackKey(currentStackFilter)
             } 
                 
            if( index > -1)
              self.stackList.splice(index, 1);  
            var eventdata={}
            eventdata["stackname"] = self.stackName
            $rootScope.$broadcast(urlevents.STACK_DELETED, eventdata);

          }, function(failure) {

          });
       
      };
     this.archiveStack = function() {
          //TODO:
          //Make API call to delete the stack
          //On success remove the stackname from the kStackList
          var toSendStack = []
          toSendStack.push(self.stackName)
          var payload = {"stacks":toSendStack};
          var currentStackFilter = urlUI.getState().selectedUrlStackKey;
          var result = store.onTopArchive({}, payload);
          result.then(function(response) {

            var index = self.stackList.indexOf(self.stackName);
            urlUI.addToArchivedStackList(self.stackName);
            //urlUI.removeFromAvailableStackList(self.stackName);
            if (currentStackFilter == self.stackName){
                 urlUI.setUrlStackKey("serversideaddedstack")
             }
             else{
                  urlUI.setUrlStackKey(currentStackFilter)
             }
            if( index > -1)
              self.stackList.splice(index, 1);
            var eventdata={}
            eventdata["stackname"] = self.stackName
            $rootScope.$broadcast(urlevents.STACK_ARCHIVED, eventdata);

          }, function(failure) {

          });

      };     
     
    },
    restrict: 'E',
    scope: {
      stackName: '<',
      stackList: '=',
      visible: '<'
    },
    template: require('../../../templates/client/stack_item.html'),
  };
};
