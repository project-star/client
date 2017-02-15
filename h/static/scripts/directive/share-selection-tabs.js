'use strict';

var uiConstants = require('../ui-constants');

module.exports = function () {
   return {
    bindToController: true,
    controllerAs: 'vm',
    //@ngInject
    controller: function ($element, annotationUI, features,datacollect) {
      this.TAB_OWN_ANNOTATIONS = 'ownannotation';
      this.TAB_SHARED_ANNOTATIONS = 'sharedannotation';


      this.kStackList = ["Create New Stack"]; //api call to retrieve the list of knowledge stacks
      this.kStack = "Create New Stack"; //default to My Renotes
      this.kStackName ="";
      

      // this.pageTitle = "";
      // this.editTitle = false;

      // this.enableTitleEdit = function() {

      //   if(!this.editTitle)
      //     this.editTitle = true;

      // };

      this.isCreatingNewStack = function() {
        console.log("090909090 Inside isCreatingNewStack with " + this.kStack);
        if(this.kStack === "Create New Stack")
          return true;

        return false;
      };


      this.getKStackList = function() {

        var uris = this.getSearchUris();
        var docURI = uris[0]; //extract the first URI
        console.log("=-=-=-Document URI is: " + docURI);

        //TODO:
        //Make the API call to list all the Knowledge stacks
        var retrievedStackList = ["one", "two", "three"];

        //Assign these to kStackList
        this.kStackList.concat(retrievedStackList);

      };

      this.setKStackForPageOnSave = function() {
        //TODO:
        //Make API call to update URL stack property with supplied stack name
        if(this.isCreatingNewStack()) {

          this.kStack = this.kStackName;
          console.log("Creating new stack with name " + this.kStack);
          
          //Add to the kStackList
          this.kStackList.push(this.kStack);
          this.kStackName="";
        }

        //Otherwise set the flag for the corresponding Stack as true and send to the API

      };      

      this.setKStackForPage = function() {

        if(this.isCreatingNewStack()) 
          return;

        //TODO:


        //Otherwise set the flag for the corresponding Stack as true and send to the API

      };

      // this.getPageTitle = function() {
      //   //TODO: Based on the URL retrieve the already assigned title to the Page (if any)
      //   //Else keep the placeholder text only
      // };

      // this.setPageTitle = function() {
      //   //TODO: On enter key, update the URL data with the text written inside the textbox
         
      //     //Pressing Enter
      //     console.log("Here is what has been supplied as the page title: " + this.pageTitle); 
      //     //Call the URL update API       

      //     //Disable the title editing
      //     this.editTitle = false;
        

      // };

      this.selectTab = function (type) {
        annotationUI.clearSelectedAnnotations()
        annotationUI.selectSharedTab(type);
      };
      this.switchAnnotationView = function (type) {
        switchAnnotationTab(type);
      };
      this.showAnnotationsUnavailableMessage = function () {
        return this.selectedSharedTab === this.TAB_OWN_ANNOTATIONS &&
          this.totalOwnAnnotations === 0 &&
          !this.isWaitingToAnchorAnnotations;
      };

      this.showNotesUnavailableMessage = function () {
        return this.selectedSharedTab === this.TAB_SHARED_ANNOTATIONS &&
          this.totalSharedAnnotations === 0;
      };
      this.showSharingEventMessage = function() {
       return datacollect.hasSharingUpdates();
      };
      this.getSharedUpdatesCount = function(){
       return datacollect.sharedUpdates().sharecount
     };

     this.getKStackList(); //Populating the Stack dropdown list
   },
    restrict: 'E',
    scope: {
      isLoading: '<',
      isWaitingToAnchorAnnotations: '<',
      selectedTab: '<',
      selectedSharedTab: '<',
      gotoSearchSelection: '&',
      switchAnnotationTab: '&',
      onClearSharing: '&',
      onVisitShared: '&',
      totalAnnotations: '<',
      totalNotes: '<',
      totalOrphans: '<',
      totalSharedAnnotations: '<',
      totalOwnAnnotations: '<',
      getSearchUris: '&',
    },
    template: require('../../../templates/client/share_selection_tabs.html'),
  };
};
