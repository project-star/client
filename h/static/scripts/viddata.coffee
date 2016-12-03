module.exports = ['localStorage', (localStorage) ->
  VIDDATA_LIST_KEY = 'hypothesis.user.viddata.list'
  VIDDATA_MAP_KEY = 'hypothesis.user.viddata.map'

  filter: (query) ->
    savedViddata = localStorage.getObject VIDDATA_LIST_KEY
    savedViddata ?= {}



  # Add newly added tags from an annotation to the stored ones and refresh
  # timestamp for every tags used.
  store: (viddata) ->
    savedViddata = localStorage.getObject VIDDATA_MAP_KEY
    savedViddata ?= {}

    for item in viddata
      if savedViddata[item.text]?
        savedViddata[item.text] = {
          text: item.text
        }

    localStorage.setObject VIDDATA_MAP_KEY, savedViddata

    tagsList = []
    for tag of savedTags
      tagsList[tagsList.length] = tag

    # Now produce TAGS_LIST, ordered by (count desc, lexical asc)
    compareFn = (t1, t2) ->
      if savedTags[t1].count != savedTags[t2].count
        return savedTags[t2].count - savedTags[t1].count
      else
        return -1 if t1 < t2
        return 1 if t1 > t2
        return 0

    tagsList = tagsList.sort(compareFn)
    localStorage.setObject TAGS_LIST_KEY, tagsList
]
