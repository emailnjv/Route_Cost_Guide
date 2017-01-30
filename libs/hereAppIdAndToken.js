// This file holds all the constants used in the Demos.
(function (exports, ctx) {
  exports.HereMapsConstants = {
    //  Set authentication token and appid

    AppIdAndToken :{
      appId: 'xBlZUyDHfF8mMpfhRmOP',
      appCode: 'SK8OSKDX10uJVORGrKi6Fg',
      language: 'en-US',
      serviceMode: 'cit'
    },
    // Initial center and zoom level of the map
    InitialLocation : {
      longitude: 52.53,
      latitude:  13.39,
      zoomLevel: 14},

    JSLibs  :{
      // versioned URL to load the HERE maps API.
      // Check on:  http://developer.here.com/versions
      // to obtain the latest version.
      HereMapsUrl :'https://js.cit.api.here.com/se/2.5.4/jsl.js?blank=true',
      // versioned URL to load jQuery
      jQueryUrl : 'https://code.jquery.com/jquery-3.1.1.slim.min.js',
      jQueryUIUrl: 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js'
    },
    NS : 'nokia'
  }
})(window, document);