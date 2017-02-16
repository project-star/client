'use strict';

module.exports = function () {
  return {
    
    bindToController: true,
    controllerAs: 'vm',
    
    //@ngInject
    controller: function (store) {
      var self=this;

      this.kStackList = []; //empty list
      this.kStackName = "";
      this.isCreatingNewStack=false;

      this.getKStackList = function() {

        var uri = "https://akeuriforcall.com";

        var payload = {"uriaddress": uri};
        // var stackRes ="";

        //Make the API call to list all the Knowledge stacks
        var result = store.stack.update({}, payload);

        result.then(function(response) {
          console.log("Successful retrieval of Stack List " + JSON.stringify(response.stacks));
          var total = response.total;

          for(var i=0; i< total; i++)
          {

            // if(response.stacks[i].status) {
            //   stackRes=response.stacks[i].name;
            //   self.kStack = stackRes;
            // }

            self.kStackList.push(response.stacks[i].name);
          }

        });
        // var tempList = ["one", "two", "three"];

        // this.kStackList.push(tempList[0]);
        // this.kStackList.push(tempList[1]);

      };

      this.setKStackForPageOnSave = function() {
        //TODO:
        //Make API call to update URL stack property with supplied stack name
        if(this.isCreatingNewStack) {

          var stackToSend =[];
          console.log("Creating new stack with name " + this.kStackName);

          //Add to the kStackList
          stackToSend.push(this.kStackName);

          var payload = {"uriaddress": "fromwebapp",
                          "stacks": stackToSend};

          var result = store.stack.update({}, payload);

          result.then(function(response) {
            console.log("Successful creation of Stacks " + response);

            //Add to the dropdown list and assign as the selection
            self.kStackList.push(self.kStackName);
            self.kStackName=""; //Next time the value will not be pre-populated with last value
            self.isCreatingNewStack=false;
          }, function(failure) {
            console.log("Failed to create Stack " + failure);
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