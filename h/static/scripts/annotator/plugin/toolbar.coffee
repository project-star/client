
Annotator = require('annotator')
$ = Annotator.$
makeButton = (item) ->
  anchor = $('<button></button>')
  .attr('href', '')
  .attr('title', item.title)
  .attr('name', item.name)
  .on(item.on)
  .addClass('annotator-frame-button')
  .addClass(item.class)
  button = $('<li></li>').append(anchor)
  return button[0]

module.exports = class Toolbar extends Annotator.Plugin
  HIDE_CLASS = 'annotator-hide'
  IDLIST = []
  #ytAnnot = []
  
  events:
    'setVisibleHighlights': 'onSetVisibleHighlights'

  html: '<div class="annotator-toolbar"></div>'

  pluginInit: ->
    @annotator.toolbar = @toolbar = $(@html)
    if @options.container?
      $(@options.container).append @toolbar
    else
      $(@element).append @toolbar

    items = [
      "title": "Toggle or Resize Sidebar"
      "class": "annotator-frame-button--sidebar_toggle h-icon-chevron-left"
      "name": "sidebar-toggle"
      "on":
        "click": (event) =>
          event.preventDefault()
          event.stopPropagation()
          collapsed = @annotator.frame.hasClass('annotator-collapsed')
#         console.log "chevron icon clicked!"
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
# 
#    ,    
#      "title": "New Bookmark"
#      "class": "h-icon-bookmark"
#      "name": "insert-comment"
#      "on":
#       "click": (event) =>
#          event.preventDefault()
#          event.stopPropagation()
#          ytplayer = new YT.Player("") 
#          ytplayer=document.getElementById("movie_player")
#          console.log "Clicked on the bookmark tool"
#          uri = document.location.href
#          console.log(ytplayer.getCurrentTime())
#          console.log (uri)
 
#          @annotator.createAnnotation()
#          @annotator.show()
#
#    ,
      "title": "Start Snippet Recording"
      "class": "annotator-frame-button--media_bar h-icon-media-record"
      "name": "insert-video-clip-start"
      "on":
       "click": (event) =>
          event.preventDefault()
          event.stopPropagation()
          uri = document.location.href
          matchYT = uri.includes("youtube.com")
          matchSC = uri.includes("soundcloud.com")
          renoted_id = new Date().getTime().toString() + Math.floor((Math.random() * 10000) + 1).toString();
          val={}

          
          if matchSC
              console.log("inside SoundCloud")
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
                  console.log(IDLIST)
                  console.log("+++++starttime+++++")
                  console.log "Start time " + starttime + "End time " + endtime
                  @annotator.createAnnotation($renoted_id : IDLIST[0].id, auddata: IDLIST)
                  IDLIST = []
                  state = true
                  this.setVideoSnippetButton state

                # Else block will never hit in this implementation
                else
                  newURI = scDomainURI + scPlayerURI

                  if IDLIST[0].uri != newURI
                    alert("Cannot create annotation as the sound has changed from the time the capture was started!")
                    
                  else
                    endtime=scPlayer[0].getAttribute('aria-valuenow')
                    console.log("+++++endtime+++++")
                    console.log(endtime)
                    IDLIST[0].endtime=endtime
                    console.log(IDLIST)
                    @annotator.createAnnotation($renoted_id : IDLIST[0].id, auddata: IDLIST)
                  
                  IDLIST=[]
                  state = false
                  this.setVideoSnippetButton state

          else if matchYT
              ytplayer=document.getElementById("movie_player")
              
              console.log("already on youtube")
              # Currently the below condition will never be hit as we are capturing the endtime in a single click
              if IDLIST.length > 0
                   endtime=ytplayer.getCurrentTime()
                   console.log("+++++endtime+++++")
                   console.log(endtime)
                   IDLIST[0].endtime=endtime
                   console.log(IDLIST)
                   
                   #ytAnnot[0].viddata[0].endtime = endtime
                   #console.log "Checking access to annot properties(2) start: " + annot.viddata[0].starttime + " end: " + annot.viddata[0].endtime
                   #@annotator.createAnnotation($renoted_id : IDLIST[0].id, viddata: IDLIST)

                   # FIX ME:Reset the endtime on clicking the end recording button
                   #@annotator.updateAnnotation($renoted_id : IDLIST[0].id, viddata: IDLIST)
                   IDLIST=[]
                   state = false
                   this.setVideoSnippetButton state
              
              else
                   starttime=ytplayer.getCurrentTime()
                   
                   #set end time to duration by default
                   endtime = ytplayer.getDuration()
                   
                   val.id =renoted_id
                   val.starttime=starttime
                   
                   # resolving Bug#33
                   val.endtime = endtime
                   val.uri=uri
                   IDLIST.push(val) 
                   console.log(IDLIST)
                   console.log("+++++starttime+++++")
                   console.log(starttime)
                   console.log "default endtime or duration" + endtime
                   
                   # Create a new annotation and get its reference
                   @annotator.createAnnotation($renoted_id : IDLIST[0].id, viddata: IDLIST)
                   IDLIST =[]

                   # Not toggling the state to keep the button color consistent throughout
                   #state = true
                   #this.setVideoSnippetButton state
          else
              alert("only works with Youtube and SoundCloud for now")

#          @annotator.createAnnotation($renoted_id : "hel1234")
#          @annotator.show()
#
#    ,
#      "title": "New Video Clip Stop"
#      "class": "h-icon-chevron-right"
#      "name": "insert-video-clip-stop"
#      "on":
#       "click": (event) =>
#          event.preventDefault()
#          event.stopPropagation()
#          ytplayer = new YT.Player("")
#          ytplayer=document.getElementById("movie_player")
#          console.log "Clicked on the bookmark tool"
          uri = document.location.href
#          console.log(ytplayer.getCurrentTime())
#          console.log (uri)

#          @annotator.createAnnotation()
#          @annotator.show()
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

  setVideoSnippetButton: (state) ->
    if state
      $('[name=insert-video-clip-start]')
      .prop('title', 'Please save the current Snip!')
      #.prop('disabled', 'true')
      .css('color', 'red');

    else
      $('[name=insert-video-clip-start]')
      .prop('title', 'Start Snippet Recording')
      .css('color', '#969696');
