'use strict';

var classnames = require('classnames');

var template = require('./adder.html');

/**
 * Show the adder above the selection with an arrow pointing down at the
 * selected text.
 */
var ARROW_POINTING_DOWN = 1;

/**
 * Show the adder above the selection with an arrow pointing up at the
 * selected text.
 */
var ARROW_POINTING_UP = 2;
var actual="id";
function toPx(pixels) {
  return pixels.toString() + 'px';
}

var ARROW_HEIGHT = 10;
var renoted_id = new Date().getTime().toString() + Math.floor((Math.random() * 10000) + 1).toString();
// The preferred gap between the end of the text selection and the adder's
// arrow position.
var ARROW_H_MARGIN = 20;
function DOMtoString(document_root,renoted_id) {
    var html = '',
        node = document_root.firstChild;
    while (node) {
        switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            html += node.outerHTML;
            break;
        case Node.TEXT_NODE:
            html += node.nodeValue;
            break;
        case Node.CDATA_SECTION_NODE:
            html += '<![CDATA[' + node.nodeValue + ']]>';
            break;
        case Node.COMMENT_NODE:
            html += '<!--' + node.nodeValue + '-->';
            break;
        case Node.DOCUMENT_TYPE_NODE:
            // (X)HTML documents are identified by public identifiers
            html += "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>\n';
            break;
        }
        node = node.nextSibling;
    }

    var data = {"msg": html,"annot":renoted_id};
    var data1 = JSON.stringify(data);

//    var xhr = new XMLHttpRequest();
//    xhr.open("POST", "http://52.220.118.188:5010/sendmsg", true);
//    xhr.setRequestHeader("Content-type", "application/json");
//    xhr.setRequestHeader("Content-length", data.length);
//    xhr.setRequestHeader("Connection", "close");
//      xhr.setRequestHeader("Access-Control-Allow-Origin","*");
//    xhr.onreadystatechange = function() {
 //      if (xhr.readyState == 4) {
 //     }
 //   }
 //   xhr.send(data1);
    return "true";
 }

function findIframes(document_root){
var  iframe = document_root.getElementsByTagName('iframe');
//console.log(iframe)
var tag = document_root.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

for (var i =0; i<iframe.length; i++){
 if (iframe[i].src.indexOf("youtube.com")!= -1 ){
    var actualSrc = iframe[i].src
    var newSrc = actualSrc.split("?")[0] + "?enablejsapi=1"
    iframe[i].src = newSrc
    ///console.log(iframe[i].src)
    //console.log(true)
   
    var newEl = document.createElement('div');
    //console.log(iframe[i].id)
    actual = iframe[i].id
    var vclass = "video-renote " + actual
    newEl.innerHTML = '<button  style="position: relative; z-index: 65535;">What is the time?</button><p style="position: relative; z-index: 65535; color:red">Hello World!</p>';
    var att = document.createAttribute("class");
    var att1 = document.createAttribute("id");
    att1.value = "renoted-video"
    iframe[i].setAttributeNode(att1)
    att.value = vclass
    newEl.setAttributeNode(att);
//    iframe[i].parentNode.insertBefore(newEl,iframe[i])
}

} 

}


function findVideoOnYoutube(document_root,options) {
    console.log(" in find VideoOnYoutube function")
    console.log(document_root.location.href)
    if (document_root.location.href.indexOf("youtube.com/watch")!= -1){
         console.log("we are on youtube playing video")
         var youtube_movie_player = document.getElementById("movie_player");
         console.log(youtube_movie_player)
         var vclass = "renote-class"
         var newEl = document.createElement('div');
         newEl.innerHTML = '<button  style="position: relative; z-index: 65535;">What is the time?</button><p style="position: relative; z-index: 65535; color:red">Hello World!</p>';
         var att = document.createAttribute("class");
         att.value = vclass
         newEl.setAttributeNode(att);
         youtube_movie_player.addEventListener('onStateChange',function(){ clickedbutton(options,youtube_movie_player)});
         //youtube_movie_player.parentNode.insertBefore(newEl,youtube_movie_player)
         //newEl.addEventListener('click', function(){ clickedbutton(options)});


   }
}
function clickedbutton(options,youtube_movie_player){
console.log(youtube_movie_player.getCurrentTime())
console.log(youtube_movie_player.getPlayerState())
console.log(youtube_movie_player.getPlaybackRate())
var vidObject = {}
vidObject.curTime = youtube_movie_player.getCurrentTime()
vidObject.curState = youtube_movie_player.getPlayerState()
vidObject.curRate = youtube_movie_player.getPlaybackRate()
options.onVidClick(vidObject)

console.log("true")
}

function findVideos(document_root){
var  iframe = document_root.getElementsByTagName('video');
//console.log(iframe)
for (var i =0; i<iframe.length; i++){
 if (iframe[i].src.indexOf("youtube.com")!= -1 ){
    //console.log(true)
    var newEl = document.createElement('div');
    newEl.innerHTML = '<p  class="video-renote" style="position: relative; z-index: 65535; color:red">Hello World!</p>';
    iframe[i].parentNode.insertBefore(newEl,iframe[i])
}

}

}

function attachShadow(element) {
  if (element.attachShadow) {
    // Shadow DOM v1 (Chrome v53, Safari 10)
    return element.attachShadow({mode: 'open'});
  } else if (element.createShadowRoot) {
    // Shadow DOM v0 (Chrome ~35-52)
    return element.createShadowRoot();
  } else {
    return null;
  }
}

/**
 * Create the DOM structure for the Adder.
 *
 * Returns the root DOM node for the adder, which may be in a shadow tree.
 */
function createAdderDOM(container) {
  var element;

  // If the browser supports Shadow DOM, use it to isolate the adder
  // from the page's CSS
  //
  // See https://developers.google.com/web/fundamentals/primers/shadowdom/
  var shadowRoot = attachShadow(container);
  if (shadowRoot) {
    shadowRoot.innerHTML = template;
    element = shadowRoot.querySelector('.js-adder');

    // Load stylesheets required by adder into shadow DOM element
    var adderStyles = Array.from(document.styleSheets).map(function (sheet) {
      return sheet.href;
    }).filter(function (url) {
      return (url || '').match(/(icomoon|inject)\.css/);
    });

    // Stylesheet <link> elements are inert inside shadow roots [1]. Until
    // Shadow DOM implementations support external stylesheets [2], grab the
    // relevant CSS files from the current page and `@import` them.
    //
    // [1] http://stackoverflow.com/questions/27746590
    // [2] https://github.com/w3c/webcomponents/issues/530
    //
    // This will unfortunately break if the page blocks inline stylesheets via
    // CSP, but that appears to be rare and if this happens, the user will still
    // get a usable adder, albeit one that uses browser default styles for the
    // toolbar.
    var styleEl = document.createElement('style');
    styleEl.textContent = adderStyles.map(function (url) {
      return '@import "' + url + '";';
    }).join('\n');
    shadowRoot.appendChild(styleEl);
  } else {
    container.innerHTML = template;
    element = container.querySelector('.js-adder');
  }
  return element;
}

/**
 * Annotation 'adder' toolbar which appears next to the selection
 * and provides controls for the user to create new annotations.
 *
 * @param {Element} container - The DOM element into which the adder will be created
 * @param {Object} options - Options object specifying `onAnnotate` and `onHighlight`
 *        event handlers.
 */
function Adder(container, options) {
  var element = createAdderDOM(container);
  findIframes(document)

  findVideoOnYoutube(document,options)
  var currentState = "";
    setInterval(function(){
    if (currentState != history.state["spf-referer"]) {
        currentState = history.state["spf-referer"];
        console.log("Do Stuff!");
        findVideoOnYoutube(document,options)
     }
    },250)
//  findVideos(document)
  Object.assign(container.style, {
    // Set initial style. The adder is hidden using the `visibility`
    // property rather than `display` so that we can compute its size in order to
    // position it before display.
    display: 'block',
    visibility: 'hidden',

    // take position out of flow and off screen initially
    position: 'absolute',
    top: 0,

    // Assign a high Z-index so that the adder shows above any content on the
    // page
    zIndex: 999,
  });
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  this.element = element;
  var view = element.ownerDocument.defaultView;
  var enterTimeout;
  var playerE;
  var vidEl = document.querySelector('.video-renote')
//  document.querySelector('.video-renote').addEventListener('click', handleCommand.bind(this,'videoiframe'));
  if (vidEl) {
  //console.log(vidEl.getAttribute("class"))
  var val = vidEl.getAttribute("class")
  var newval= val.replace('video-renote ', '');
 // var playerE = new YT.Player(newval,{ events: {
 //           'onReady': onPlayerReady,
 //           'onStateChange': onPlayerStateChange
 //         }});
  vidEl.addEventListener('click', function(){ myRenoteFunction(val)});
  }
  element.querySelector('.js-annotate-btn')
    .addEventListener('click', handleCommand.bind(this, 'annotate'));
  element.querySelector('.js-highlight-btn')
    .addEventListener('click', handleCommand.bind(this, 'highlight'));
//  element.querySelector('.trial')
//    .addEventListener('click', handleCommand.bind(this, 'annotate'));

   if (document.location.href.indexOf("youtube.com/watch")!= -1){
         console.log("we are on youtube playing video")
         var youtube_movie_player = document.getElementById("movie_player");
         console.log(youtube_movie_player)

         youtube_movie_player.addEventListener('click', handleCommand.bind(this,'videoiframe'));


   }


  function myRenoteFunction(val){
    document.addEventListener('message', function (event) {console.log(event.data)}, false);
    var newval= val.replace('video-renote ', '');
    console.log(newval)
    var check = true
    console.log(val)
  
    if (playerE == null){
    console.log("new instance created")
    playerE = new YT.Player("renoted-video",{ events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }});
   }
    console.log(playerE)
    
  }
   function readyYoutube(){
    if((typeof YT !== "undefined") && YT && YT.Player){
        console.log("not ready")
    }else{
        setTimeout(readyYoutube, 100);
    }
}
   function onPlayerReady(event){
    console.log(playerE.getCurrentTime())
    console.log(event.target)
   }


   function onPlayerStateChange(event){
    console.log(playerE.getCurrentTime())
    console.log(event.target)
   }

  function onPlayerS(player){
    console.log(playerE.getCurrentTime())
   }
  
  function handleCommand(command, event) {
    event.preventDefault();
    event.stopPropagation();

    if (command === 'annotate') {
      renoted_id = new Date().getTime().toString() + Math.floor((Math.random() * 10000) + 1).toString();
      DOMtoString(document,renoted_id);
      options.onAnnotate(renoted_id);
    } else if (command === 'search'){
      renoted_id = new Date().getTime().toString() + Math.floor((Math.random() * 10000) + 1).toString();
      DOMtoString(document,renoted_id)
      options.onSearch(check2);
    } else if (command === 'videoiframe'){
      console.log(this)
      renoted_id = new Date().getTime().toString() + Math.floor((Math.random() * 10000) + 1).toString();
      options.onVideoiframe(renoted_id);
    } else {
      renoted_id = new Date().getTime().toString() + Math.floor((Math.random() * 10000) + 1).toString();
      DOMtoString(document,renoted_id);
      options.onHighlight(renoted_id);
  
    }

    this.hide();
  }

  function width() {
    return element.getBoundingClientRect().width;
  }

  function height() {
    return element.getBoundingClientRect().height;
  }

  /** Hide the adder */
  this.hide = function () {
    clearTimeout(enterTimeout);
    element.className = classnames({'annotator-adder': true});
    container.style.visibility = 'hidden';
  };

  /**
   * Return the best position to show the adder in order to target the
   * selected text in `targetRect`.
   *
   * @param {Rect} targetRect - The rect of text to target, in document
   *        coordinates.
   * @param {boolean} isSelectionBackwards - True if the selection was made
   *        backwards, such that the focus point is mosty likely at the top-left
   *        edge of `targetRect`.
   */
  this.target = function (targetRect, isSelectionBackwards) {
    // Set the initial arrow direction based on whether the selection was made
    // forwards/upwards or downwards/backwards.
    var arrowDirection;
    if (isSelectionBackwards) {
      arrowDirection = ARROW_POINTING_DOWN;
    } else {
      arrowDirection = ARROW_POINTING_UP;
    }
    var top;
    var left;

    // Position the adder such that the arrow it is above or below the selection
    // and close to the end.
    var hMargin = Math.min(ARROW_H_MARGIN, targetRect.width);
    if (isSelectionBackwards) {
      left = targetRect.left - width() / 2 + hMargin;
    } else {
      left = targetRect.left + targetRect.width - width() / 2 - hMargin;
    }

    // Flip arrow direction if adder would appear above the top or below the
    // bottom of the viewport.
    //
    // Note: `pageYOffset` is used instead of `scrollY` here for IE
    // compatibility
    if (targetRect.top - height() < view.pageYOffset &&
        arrowDirection === ARROW_POINTING_DOWN) {
      arrowDirection = ARROW_POINTING_UP;
    } else if (targetRect.top + height() > view.pageYOffset + view.innerHeight) {
      arrowDirection = ARROW_POINTING_DOWN;
    }

    if (arrowDirection === ARROW_POINTING_UP) {
      top = targetRect.top + targetRect.height + ARROW_HEIGHT;
    } else {
      top = targetRect.top - height() - ARROW_HEIGHT;
    }

    // Constrain the adder to the viewport.
    left = Math.max(left, view.pageXOffset);
    left = Math.min(left, view.pageXOffset + view.innerWidth - width());

    top = Math.max(top, view.pageYOffset);
    top = Math.min(top, view.pageYOffset + view.innerHeight - height());

    return {top: top, left: left, arrowDirection: arrowDirection};
  };

  /**
   * Show the adder at the given position and with the arrow pointing in
   * `arrowDirection`.
   */
  this.showAt = function (left, top, arrowDirection) {
    element.className = classnames({
      'annotator-adder': true,
      'annotator-adder--arrow-down': arrowDirection === ARROW_POINTING_DOWN,
      'annotator-adder--arrow-up': arrowDirection === ARROW_POINTING_UP,
    });

    Object.assign(container.style, {
      top: toPx(top),
      left: toPx(left),
      visibility: 'visible',
    });

    clearTimeout(enterTimeout);
    enterTimeout = setTimeout(function () {
      element.className += ' is-active';
    }, 1);
  };
}

module.exports = {
  ARROW_POINTING_DOWN: ARROW_POINTING_DOWN,
  ARROW_POINTING_UP: ARROW_POINTING_UP,

  Adder: Adder,
};
