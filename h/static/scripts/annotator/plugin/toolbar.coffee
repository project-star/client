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
          if collapsed
            @annotator.show()
          else
            @annotator.hide()
    ,
      "title": "Hide Highlights"
      "class": "h-icon-visibility"
      "name": "highlight-visibility"
      "on":
        "click": (event) =>
          event.preventDefault()
          event.stopPropagation()
          state = not @annotator.visibleHighlights
          @annotator.setVisibleHighlights state
    #
    # Anshul: Removing the Page Note functionality
    #,
    #  "title": "New Page Note"
    #  "class": "h-icon-note"
    #  "name": "insert-comment"
    #  "on":
    #    "click": (event) =>
    #      event.preventDefault()
    #      event.stopPropagation()
    #      @annotator.createAnnotation()
    #      @annotator.show()
    ,
      "title": "Bookmark Page"
      "class": "h-icon-bookmark"
      "name": "bookmark-page"
      "on":
        "click": (event) =>
          event.preventDefault()
          event.stopPropagation()
          console.log "Clicked on the bookmark tool"
          uri = document.location.href
          title = document.title
          jsondata = {
                        "title":title,
                        "uri":uri
                     }
          console.log jsondata
          console.log uri
          console.log title
          #create a AJAX call to update the bookmark information in server
          $.ajax
            url: 'http://52.220.118.188:5010/addbookmark' #put in config later
            type: 'POST'
            dataType: 'json'
            data: JSON.stringify(jsondata)
            headers: {
                     'Content-Type': 'application/json'
            }
            error: (data, status, response) ->
                console.log data
                console.log status
                console.log response
            success: (data, status, response) ->
                console.log data
                console.log status
                console.log response
                console.log "success"

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
