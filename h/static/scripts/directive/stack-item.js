'use strict';

module.exports = function () {
  return {
    
    bindToController: true,
    controllerAs: 'vm',
    
    //@ngInject
    controller: function (store) {

      var self=this;

      this.isEditing=false;
      this.newName="";

      this.prunedStackName = function() {
        var prunedName = this.stackName;
        if (this.stackName.length > 12) {
          prunedName = this.stackName.slice(0, 12) + '…';
        }
        return prunedName;        
      };

      this.cancelEditing = function() {

        console.log("New Name: " + this.newName);
        this.isEditing=false;
        this.newName="";
      };


      this.replaceStackName = function() {

          //TODO:
          //Make API call

        //On success

        console.log("New Name is " + self.newName);

        var index = self.stackList.indexOf(self.stackName);
        if( index > -1)
          self.stackList[index]=self.newName;

        console.log("Stack list now " + self.stackList);

        //self.newName="";
        self.isEditing=false;

        //On failure
        //self.newName="";
        self.isEditing=false;


      };


      this.deleteStack = function() {
          //TODO:
          //Make API call to delete the stack
          //On success remove the stackname from the kStackList

        var index = self.stackList.indexOf(self.stackName);
        if( index > -1)
          self.stackList.splice(index, 1);         
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