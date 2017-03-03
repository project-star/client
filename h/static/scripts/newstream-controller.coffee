angular = require('angular')

module.exports = class NewStreamController
  this.$inject = [
    '$scope', '$location', '$route', '$rootScope', '$routeParams',
    'annotationUI','urlUI',
    'queryParser', 'rootThread', 'searchFilter', 'store',
    'streamer', 'streamFilter', 'annotationMapper','urlMapper','datacollect'
  ]
  constructor: (
     $scope,  $location,   $route,   $rootScope,   $routeParams
     annotationUI,urlUI,
     queryParser,   rootThread,   searchFilter,   store,
     streamer,   streamFilter,   annotationMapper,  urlMapper, datacollect
  ) ->
    urlUI.setAppIsSidebar(false)
    toSort = true
    offset = 0
    fetch = (limit) ->
      options = {offset, limit}
      searchParams = searchFilter.toObject($routeParams.q)
      query = angular.extend(options, searchParams)
      query._separate_replies = true
      store.search(query)
        .then(load)
        .catch((err) -> console.error err)
     

    fetchurllist = () ->
        searchParams = searchFilter.toObject($routeParams.q)
        console.log(searchParams)
        console.log(toSort)
        console.log(Object.keys(searchParams).length)
        if searchParams.hasOwnProperty('any')
            toSort = false
        $scope.isLoading=true;
        urlUI.setUrlLoading(true)
        console.log(urlUI.getState().urlLoading)
        query = angular.extend(searchParams)
        store.urls(query).then(loadurllist).catch((err) -> console.error err)

    loadurllist = ({total,urllist}) ->
        console.log("+++in new loadurllist function++++")
        console.log(urllist)
        $scope.isLoading=false;
        urlUI.setUrlLoading(false)
        console.log(urlUI.getState().urlLoading)
        urlMapper.loadUrls(urllist)

    fetchurl = (urlid) ->
        store.url({id: urlid}).then(loadurl).catch((err) -> console.error err)
 
    loadurl = ({rows,replies}) ->
        console.log("+++in new loadurl function++++")
        console.log(rows.annotations)
    #    annotationMapper.loadAnnotations(rows.annotations)
     

     
    load = ({rows, replies}) ->
      offset += rows.length
      console.log("++++in new stream-filter-controller++++")
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
      console.log("printing the urllist in new stream controller")
      console.log(urllist)
      fetchurllist()      
      for urlvalue in urllist
          for val1 in rows
              if val1.uri_id == urlvalue
                  console.log("+++++in load function in new stream controller++++++")
                  console.log(val1.uri_id)
                  rowsnew.push(val1)
      console.log(rowsnew)
    #  annotationMapper.loadAnnotations(rowsnew, replies)

    # Reload on query change (ignore hash change)
    lastQuery = $routeParams.q
    $scope.$on '$routeUpdate', ->
      if $routeParams.q isnt lastQuery
       datacollect.connectionsend("searchOnWebsite")
       urlUI.clearUrls()
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
    datacollect.connect()
    # Perform the initial search
    urlUI.clearUrls()
    fetchurllist()
    $scope.setCollapsed = (id, collapsed) ->
      urlUI.setCollapsed(id, collapsed)

    $scope.forceVisible = (id) ->
      urlUI.setForceVisible(id, true)

    Object.assign $scope.search, {
      query: -> $routeParams.q || ''
      update: (q) -> $location.search({q: q})
    }

    urlUI.subscribe( ->
      $scope.rootThread = rootThread.thread(urlUI.getState())
    );

    # Sort the stream so that the newest annotations are at the top
    if (toSort)
        urlUI.setSortKey('Update Time :Descending')
    else
        urlUI.setSortKey('Relevance')
    $scope.isStream = true
#    $scope.loadMore = fetchurllist
