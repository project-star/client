'use strict';
var urlevents = require('../urlevents');
module.exports = function () {
  return {
    
    bindToController: true,
    controllerAs: 'vm',
    
    //@ngInject
    controller: function ($scope,store,urlUI) {
      var self=this;
      this.isUrlLoading = urlUI.getState().urlLoading;
      this.archivedList = []; //empty list
      this.archivedName = "";
      this.showArchives = false;
      this.showStacks = function(){
           this.showArchives= !this.showArchives
      }
      this.getArchivedList = function() {

        var payload = {};
        // var stackRes ="";

        //Make the API call to list all the Knowledge stacks
        var result = store.stackService.read({});

        result.then(function(response) {
          var total = response.total;

          for(var i=0; i< total; i++)
          {

            // if(response.stacks[i].status) {
            //   stackRes=response.stacks[i].name;
            //   self.kStack = stackRes;
            // }
            if (response.stacks[i].archived){
            self.archivedList.push(response.stacks[i].name);
            urlUI.addToArchivedStackList(response.stacks[i].name);
            }
          }

        });

      };


        //Otherwise set the flag for the corresponding Stack as true and send to the API
      $scope.$on(urlevents.STACK_ARCHIVED, function (event, eventdata) {
          self.archivedList.push(eventdata["stackname"])
     });


      this.getArchivedList(); //Populating the Stack list

    },
    restrict: 'E',
    template: require('../../../templates/client/archived_list.html'),
  };
};
