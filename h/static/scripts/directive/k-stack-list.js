'use strict';
var urlevents = require('../urlevents');
module.exports = function () {
  return {
    
    bindToController: true,
    controllerAs: 'vm',
    
    //@ngInject
    controller: function (store,urlUI) {
      var self=this;
      this.isUrlLoading = urlUI.getState().urlLoading;
      this.kStackList = []; //empty list
      this.kStackName = "";
      this.isCreatingNewStack=false;
      this.newKStackName = "";
      this.isStackSelected = function(stackname){ 
      if (stackname == urlUI.getState().selectedUrlStackKey){
          return true
      }
      else {
          return false
      }
      };
      this.getKStackList = function() {

        var uri = "https://akeuriforcall.com";

        var payload = {"uriaddress": uri};
        // var stackRes ="";

        //Make the API call to list all the Knowledge stacks
        var result = store.stack.update({}, payload);

        result.then(function(response) {
          var total = response.total;

          for(var i=0; i< total; i++)
          {

            // if(response.stacks[i].status) {
            //   stackRes=response.stacks[i].name;
            //   self.kStack = stackRes;
            // }

            self.kStackList.push(response.stacks[i].name);
            urlUI.addToAvailableStackList(response.stacks[i].name);
          }

        });

      };

      this.setKStackForPageOnSave = function() {
        //TODO:
        //Make API call to update URL stack property with supplied stack name
        if(this.isCreatingNewStack) {

          var stackToSend =[];

          //Add to the kStackList
          stackToSend.push(this.kStackName);

          var payload = {"uriaddress": "fromwebapp",
                          "stacks": stackToSend};

          var result = store.stack.update({}, payload);

          result.then(function(response) {

            //Add to the dropdown list and assign as the selection
            self.kStackList.push(self.kStackName);
            urlUI.addToAvailableStackList(self.kStackName);
            self.kStackName=""; //Next time the value will not be pre-populated with last value
            self.isCreatingNewStack=false;
          }, function(failure) {
          });

        }

        //Otherwise set the flag for the corresponding Stack as true and send to the API

      }; 


      this.getKStackList(); //Populating the Stack list

    },
    restrict: 'E',
    template: require('../../../templates/client/k_stack_list.html'),
  };
};
