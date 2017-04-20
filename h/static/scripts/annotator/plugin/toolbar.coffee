Annotator = require('annotator')
$ = Annotator.$
isMedia = ->
  uri = document.location.href
  matchYT = uri.includes("youtube.com")
  matchSC = uri.includes("soundcloud.com")
  matchDM = uri.includes("dailymotion.com")
  if matchYT or matchSC or matchDM
    return true
  
  return false
iframeyoutubes = []
videoembeds = []
eplayer=null
countYT =false 
initialYT=false
YTinitialized=false
isEmbedIframe = ->
#  anyYTplayer=document.getElementById("article_body")
#  iframe = document.getElementsByTagName('video')
  iframes = document.getElementsByTagName('iframe')
  videoiframes = document.getElementsByTagName('video')
#  innerDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeyoutubes=[]
  tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
#  innerDoc = iframe.contentWindow.postMessage(JSON.stringify({'event': 'command','func': 'playVideo'}), '*');
#  pid = iframe.getAttribute('id');
#  player = new YT.Player(pid, {
#    events: {
#      'onReady': onPlayerReady,
#      'onStateChange': onPlayerStateChange
#    }
#  });
#  anyYTplayer = document.getElementsByTagName("video")
#  anyYTplayer=document.getElementsByClassName("html5-video-container")
#  anyYTplayer =  document.querySelector('div[aria-label="YouTube Video Player"]');
#  anystarttime=iframe.getDuration()
#  console.log("+++this is on any page where anyYTplayer in instantiated+++++")
#  console.log(iframe)
#  console.log(innerDoc)
#  anyYTplayer = document.getElementById("movie_player");
#  anystarttime=anyYTplayer.getCurrentTime();
  #player = new playerjs.Player('iframe');
#  console.log(player)
  #anystarttime=player.getDuration();
  #console.log(anystarttime)
  for iframe in iframes
    if iframe.src.includes("youtube.com")
        pid = iframe.getAttribute('id');
#        innerDoc = iframe.contentWindow.postMessage(JSON.stringify({'event': 'command','func': 'playVideo'}), '*');
#        console.log(innerDoc)
#        videoelement = iframe.contentWindow.getElementById('video');
#        console.log(videoelement)
        iframe.addEventListener("click",onListener.bind(this))       
#        console.log (pid)
        if (YT?)
          initialYT=true
        else 
          initialYT=false
        if (initialYT)
            eplayer = new YT.Player(pid, {
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
              }
            });
         
        
            iframeyoutubes.push(eplayer)
         else
            iframeyoutubes.push(pid) 
         break;
#  console.log(iframeyoutubes)
  return iframeyoutubes


sleep = (ms) ->
  start = new Date().getTime()
  continue while new Date().getTime() - start < ms

onListener = (event) ->
#  console.log("in listener function")
  if (YT?)
      eplayer = new YT.Player(pid, {events: {'onStateChange': onPlayerStateChange } });
      YTinitialized=true
onPlayerStateChange = ->
    countYT=true
#  console.log("true")
#  console.log(eplayer)
onPlayerReady = (event) ->
    countYT=true
#  console.log(eplayer)

makeButton = (item) ->
  anchor = $('<button></button>')
  .attr('href', '')
  .attr('title', item.title)
  .attr('name', item.name)
  .on(item.on)
  .addClass('annotator-frame-button')
  .addClass(item.class)

  if item.name.includes("insert-video-clip")
    iframeyoutubes = isEmbedIframe()
    if not isMedia() and iframeyoutubes.length == 0
      anchor.css('display', 'none');
      anchor.attr('disabled', 'true')
      anchor.css('color', '#969696')
    else 
      anchor.attr('display', 'inline')
      anchor.css('color', 'red')
  
  button = $('<li></li>').append(anchor)
  return button[0]


module.exports = class Toolbar extends Annotator.Plugin
  HIDE_CLASS = 'annotator-hide'
  IDLIST = []
  paramList = []
  #ytAnnot = []
  
  events:
    'setVisibleHighlights': 'onSetVisibleHighlights'
#    'setVideoSnippetButton': 'onSetVideoSnippetButton'

  html: '<div class="annotator-toolbar"></div>'

  pluginInit: ->
    @annotator.toolbar = @toolbar = $(@html)
    if @options.container?
      $(@options.container).append @toolbar
    else
      $(@element).append @toolbar

    items = [
      "title": "Click to open and close and drag to resize the Sidebar"
      "class": "annotator-frame-button--sidebar_toggle h-icon-chevron-left"
      "name": "sidebar-toggle"
      "on":
        "click": (event) =>
          event.preventDefault()
          event.stopPropagation()
          collapsed = @annotator.frame.hasClass('annotator-collapsed')
          if collapsed
            @annotator.show()
          else
            @annotator.hide()
    ,
#      "title": "Hide Highlights"
#      "class": "h-icon-visibility"
#      "name": "highlight-visibility"
#      "on":
#        "click": (event) =>
#          event.preventDefault()
#          event.stopPropagation()
#          state = not @annotator.visibleHighlights
#          @annotator.setVisibleHighlights state
#    ,    
#
      "title": "Click to start recording and taking notes on Youtube videos and Soundcloud audios"
      "class": "annotator-frame-button--media_bar h-icon-media-record"
      "name": "insert-video-clip"
      "on":
       "click": (event) =>
          event.preventDefault()
          event.stopPropagation()
          uri = document.location.href
          matchYT = uri.includes("youtube.com")
          matchSC = uri.includes("soundcloud.com")
          matchDM = uri.includes("dailymotion.com")
          renoted_id = new Date().getTime().toString() + Math.floor((Math.random() * 10000) + 1).toString();
          val={}
          params={}
          if matchDM
              #Add the code to read the start and end times and create annotation
              console.log "in the DM match condition on toolbar.coffee"
              val.id =renoted_id
              val.starttime=5
              val.endtime = 10
              val.uri = "http://www.dailymotion.com/video/x5hw0xz_khalifa-st-fort-girls-under-20-100-m_sport"
              val.title = "check"
              IDLIST.push(val) 
              @annotator.createAnnotation($renoted_id : IDLIST[0].id, dmdata: IDLIST)
                  
              IDLIST = []

          else if matchSC
              scDomainURI = "https://soundcloud.com"
              scPlayer=document.getElementsByClassName("playbackTimeline__progressWrapper")

              # Getting the URI from the player as continuous playback leads to 
              # mismatch in soundtrack URI and Tab URI
              scPlayback = document.getElementsByClassName("playbackSoundBadge")
              scPlayerLink = scPlayback[0].getElementsByTagName("a")
              scPlayerURI = scPlayerLink[0].getAttribute("href")
              scTitleElems = scPlayback[0].getElementsByClassName("playbackSoundBadge__title sc-truncate")
              scPlayerTitle = scTitleElems[0].getAttribute("title")
            
              if not scPlayer.length > 0
                alert "No sound playing"
              else
                if not IDLIST.length > 0
                  starttime=scPlayer[0].getAttribute('aria-valuenow')
                  endtime=scPlayer[0].getAttribute('aria-valuemax')
                  val.id =renoted_id
                  val.starttime=starttime
                  val.endtime = endtime
                  val.uri = scDomainURI + scPlayerURI
                  val.title = scPlayerTitle
                  IDLIST.push(val) 
                  @annotator.createAnnotation($renoted_id : IDLIST[0].id, auddata: IDLIST)
                  
                  IDLIST = []
                  #state = true
                  #@toolbar.setVideoSnippetButton state

                # Else block will never hit in @annotator implementation
                else
                  newURI = scDomainURI + scPlayerURI

                  if IDLIST[0].uri != newURI
                    alert("Cannot create annotation as the sound has changed from the time the capture was started!")
                    
                  else
                    endtime=scPlayer[0].getAttribute('aria-valuenow')
                    IDLIST[0].endtime=endtime
                    @annotator.createAnnotation($renoted_id : IDLIST[0].id, auddata: IDLIST)
                  
                  IDLIST=[]
                  #state = false
                  #@toolbar.setVideoSnippetButton state

          else if matchYT
              ytplayer=document.getElementById("movie_player")
              
              # Currently the below condition will never be hit as we are capturing the endtime in a single click
              if IDLIST.length > 0
                   endtime=ytplayer.getCurrentTime()
                   IDLIST[0].endtime=endtime

                   # FIX ME:Reset the endtime on clicking the end recording button
                   @annotator.createAnnotation($renoted_id : IDLIST[0].id, viddata: IDLIST)
                   IDLIST=[]
                   #state = false
                   #@toolbar.setVideoSnippetButton state
              
              else
                   starttime=ytplayer.getCurrentTime()
                                      
                   #set end time to duration by default
                   endtime = ytplayer.getDuration()
                   
                   val.id =renoted_id
                   val.starttime=starttime
                   params.curTime = ytplayer.getCurrentTime()
                   params.curRate = ytplayer.getPlaybackRate()
                   params.curState = ytplayer.getPlayerState()
                   paramList.push(params)
                   # resolving Bug#33
                   val.endtime = endtime
                   val.uri=uri
                   IDLIST.push(val) 
                   # Create a new annotation and get its reference
                   @annotator.createAnnotation($renoted_id : IDLIST[0].id, viddata: IDLIST,params:paramList, $newMedia:true)
                   IDLIST = []
                   paramList =[]
                   #state = true
                   #@toolbar.setVideoSnippetButton state
          else if iframeyoutubes.length > 0
              for iframe in iframeyoutubes
                   if (!initialYT)
                       if (eplayer==null)
                           #console.log(true)
                           eplayer = new YT.Player(iframe, {events: {'onStateChange': onPlayerStateChange } });
                       if !(eplayer.getCurrentTime?)
                           sleep 1000
                       if (eplayer.getCurrentTime?)
                           #console.log(eplayer.getCurrentTime())
                           if IDLIST.length > 0
                               endtime=eplayer.getCurrentTime()
                               IDLIST[0].endtime=endtime

                               # FIX ME:Reset the endtime on clicking the end recording button
                               @annotator.createAnnotation($renoted_id : IDLIST[0].id, viddata: IDLIST)
                               IDLIST=[]
                               #state = false
                               #@toolbar.setVideoSnippetButton state

                           else
                               starttime=eplayer.getCurrentTime()

                               #set end time to duration by default
                               endtime = eplayer.getDuration()

                               val.id =renoted_id
                               val.starttime=starttime

                               # resolving Bug#33
                               val.endtime = endtime
                               val.uri=eplayer.getVideoUrl()
                               IDLIST.push(val)

                               # Create a new annotation and get its reference
                               @annotator.createAnnotation($renoted_id : IDLIST[0].id, viddata: IDLIST)
                               IDLIST = []
                       else if !countYT
                            alert("You may need to press the button again if video has started or press this button after starting the video")
                            #console.log("You may need to press the button again if video has started or press this button after starting the video")
                            countYT = true
                       else 
                            #console.log("If video has started and you sre seeing this message. You may need to refresh or site dosen't support it")
                            countYT = true
                          
                   else
                       if (iframe.getCurrentTime?)
                           #console.log(iframe.getCurrentTime())
                           if IDLIST.length > 0
                               endtime=iframe.getCurrentTime()
                               IDLIST[0].endtime=endtime

                               # FIX ME:Reset the endtime on clicking the end recording button
                               @annotator.createAnnotation($renoted_id : IDLIST[0].id, viddata: IDLIST)
                               IDLIST=[]
                               #state = false
                               #@toolbar.setVideoSnippetButton state

                           else
                               starttime=iframe.getCurrentTime()

                               #set end time to duration by default
                               endtime = iframe.getDuration()

                               val.id =renoted_id
                               val.starttime=starttime

                               # resolving Bug#33
                               val.endtime = endtime
                               val.uri=iframe.getVideoUrl()
                               IDLIST.push(val)

                               # Create a new annotation and get its reference
                               @annotator.createAnnotation($renoted_id : IDLIST[0].id, viddata: IDLIST)
                               IDLIST = []
                       else if !countYT
                            #console.log("You may need to press the button again if video has started or press this button after starting the video")
                            countYT=true
                       else
                            #console.log("If video has started and you sre seeing this message. You may need to refresh or site dosen't support it")
                            countYT=true
          else
              alert("only works with Youtube and SoundCloud for now")

    ]
    @buttons = $(makeButton(item) for item in items)

    list = $('<ul></ul>')
    @buttons.appendTo(list)
    @toolbar.append(list)

    # Remove focus from the anchors when clicked, this removes the focus
    # styles intended only for keyboard navigation. IE/FF apply the focus
    # psuedo-class to a clicked element.
    @toolbar.on('mouseup', 'a', (event) -> $(event.target).blur())

  onSetVisibleHighlights: (state) ->
    if state
      $('[name=highlight-visibility]')
      .removeClass('h-icon-visibility-off')
      .addClass('h-icon-visibility')
      .prop('title', 'Hide Highlights');

    else
      $('[name=highlight-visibility]')
      .removeClass('h-icon-visibility')
      .addClass('h-icon-visibility-off')
      .prop('title', 'Show Highlights');


  onSetVideoSnippetButton: (state) ->
    
    if state
      $('[name=insert-video-clip-start]')
      .prop('title', 'Please save the current notes before starting new clip!')
      #.prop('disabled', 'true')
      .css('color', 'red');

    else
      $('[name=insert-video-clip-start]')
      .prop('title', 'Click to start recording and taking notes')
      .css('color', '#969696');
