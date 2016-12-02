/* eslint consistent-this: ["error", "vm"] */

'use strict';

// @ngInject
function youtube($window) {
  return {
    restrict: "E",

    scope: {
      height:   "<",
      width:    "<",
      videoid:  "<"  
    },

    template: '<div></div>',

    link: function(scope, element) {
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      console.log("in true youtube initializer")
      var player;

      window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player(element.children()[0], {
          height: scope.height,
          width: scope.width,
          videoId: scope.videoid
        });
      };
    },  
  }
}

module.exports = {
  // These private helper functions aren't meant to be part of the public
  // interface of this module. They've been exported temporarily to enable them
  // to be unit tested.
  // FIXME: The code should be refactored to enable unit testing without having
  // to do this.

  // These are meant to be the public API of this module.
  directive: youtube,
//  controller: YoutubeController,
};
