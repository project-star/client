angular = require('angular')

module.exports = class StreamController
  this.$inject = [
    '$scope', '$location', '$route', '$rootScope', '$routeParams',
    'annotationUI',
    'queryParser', 'rootThread', 'searchFilter', 'store',
    'streamer', 'streamFilter', 'annotationMapper'
  ]
  constructor: (
     $scope,  $location,   $route,   $rootScope,   $routeParams
     annotationUI,
     queryParser,   rootThread,   searchFilter,   store,
     streamer,   streamFilter,   annotationMapper
  ) ->
    annotationUI.setAppIsSidebar(false)

    offset = 0

    fetch = (limit) ->
      options = {offset, limit}
      searchParams = searchFilter.toObject($routeParams.q)
      query = angular.extend(options, searchParams)
      query._separate_replies = true
      store.search(query)
        .then(load)
        .catch((err) -> console.error err)
    


    fetchurl = (urlid) ->
       store.url({id: urlid}).then(loadurl).catch((err) -> console.error err)

    loadurl = ({rows,replies}) ->
       console.log("+++in new loadurl function++++")
       console.log(rows)
     
    load = ({rows, replies}) ->
      offset += rows.length
      console.log("++++in stream-filter-controller++++")
      urllist=[]
      rowsnew=[]
      console.log(rows)
      for val in rows
          console.log(val.uri_id)
          if (val.uri_id) not in urllist
              val.type='first'
              val.recall='first'
              urllist.push(val.uri_id)
          else
              val.type='second'
      console.log("printing the urllist")
      console.log(urllist)
      
      for urlvalue in urllist
          
          fetchurl(urlvalue)         
          for val1 in rows
              if val1.uri_id == urlvalue
                  console.log("+++++in load function in stream controller++++++")
                  console.log(val1.uri_id)
                  rowsnew.push(val1)
      console.log(rowsnew)
      annotationMapper.loadAnnotations(rowsnew, replies)

    # Reload on query change (ignore hash change)
    lastQuery = $routeParams.q
    $scope.$on '$routeUpdate', ->
      if $routeParams.q isnt lastQuery
        annotationUI.clearAnnotations()
        $route.reload()

    # Initialize the base filter
    streamFilter
      .resetFilter()
      .setMatchPolicyIncludeAll()

    # Apply query clauses
    terms = searchFilter.generateFacetedFilter $routeParams.q
    queryParser.populateFilter streamFilter, terms
    streamer.setConfig('filter', {filter: streamFilter.getFilter()})
    streamer.connect()

    # Perform the initial search
    fetch(20)

    $scope.setCollapsed = (id, collapsed) ->
      annotationUI.setCollapsed(id, collapsed)

    $scope.forceVisible = (id) ->
      annotationUI.setForceVisible(id, true)

    Object.assign $scope.search, {
      query: -> $routeParams.q || ''
      update: (q) -> $location.search({q: q})
    }

    annotationUI.subscribe( ->
      $scope.rootThread = rootThread.thread(annotationUI.getState())
    );

    # Sort the stream so that the newest annotations are at the top
    annotationUI.setSortKey('Newest')

    $scope.isStream = true
    $scope.loadMore = fetch
