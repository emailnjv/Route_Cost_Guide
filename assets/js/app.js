var location_cordinates = [];
var routes = [];
var locations;
var route_num = 1;
var start_point = false;
var end_point = false;
var response_peek;
var map;
var voice_response;
var hidpi = ('devicePixelRatio' in window && devicePixelRatio > 1);

var mapContainer = document.getElementById('map');
var routeInstructionsContainer;


// check if the site was loaded via secure connection
var secure = (location.protocol === 'https:') ? true : false;


// Create a platform object to communicate with the HERE APIs
var platform = new H.service.Platform({
        useCIT: true,
        app_id: "xBlZUyDHfF8mMpfhRmOP",
        app_code: "SK8OSKDX10uJVORGrKi6Fg",
        useHTTPS: secure
    }),
    maptypes = platform.createDefaultLayers(hidpi ? 512 : 256, hidpi ? 320 : null),
    geocoder = platform.getGeocodingService(),
    router = platform.getRoutingService(),
    group = new H.map.Group(),
    markerGroup = new H.map.Group(),
    map = new H.Map(mapContainer, maptypes.normal.map,
        {
            center: new H.geo.Point(40.0583, -74.4057),
            zoom: 8
        }
    );

// add behavior control
new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// add UI
var ui = H.ui.UI.createDefault(map, maptypes);

platform.configure(H.map.render.panorama.RenderEngine);

// add window resizing event listener
window.addEventListener('resize', function () {
    map.getViewPort().resize();
});

var pointA;
var pointB;
var startMarker = null;
var destMarker = null;
var route_info_id;

var routeColor = ["rgba(236, 112, 99, 0.8)", "rgba(155, 89, 182, 0.8)", "rgba(41, 128, 185, 0.8)","rgba(26, 188, 156, 0.8)","rgba(39, 174, 96, 0.8)"];

map.addObject(markerGroup);


// Get the modal
var modal = document.getElementById('myModal');



// When the user clicks on <span> (x), close the modal
$(".close").on("click", function() {
    $(".modal").css("display","none");
});

// // When the user clicks anywhere outside of the modal, close it
// window.onclick = function(event) {
//     if (event.target == modal) {
//         modal.style.display = "none";
//     }
// }


//voice recognition
$("#voice_rec").on("click", function(){
    $("#myModal").css("display","block");
    if (window.hasOwnProperty('webkitSpeechRecognition')) {

        var recognition = new webkitSpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.lang = "en-US";
        recognition.start();

        recognition.onresult = function(e) {

            console.log(e);
            voice_response = e.results[0][0].transcript;
             $(".modal").css("display","none");

            //goes through response and parses' out need info
            var voice_1 = voice_response.split("starting location");
            voice_1 = voice_1[1].split("destination");
            if (voice_1.length > 1){
                voice_1[0].trim();
                voice_1[1].trim();
                $("#free_text_text_box_1").val(voice_1[0]);
                $("#free_text_text_box_2").val(voice_1[1]);
            }else{
                return;
            }
            recognition.stop();
        };

        recognition.onerror = function(e) {
            recognition.stop();
        };
    }
});


//beginning of the routing api
function start(platform) {

    //if route wrapper is empty (for beginning animation)
    if ($(".route_wrapper").length == 0) {
        $('#map').animate({"width": "50%"}, 500);
        $('.map_wrapper').append($('<div>').addClass('route_wrapper'));
        $('.route_wrapper').animate({"opacity": "1"}, 1000);

        //if not means another search therefore zeros everything out and recalls query
    }else if ($(".route_wrapper").length != 0){
        pointA = null;
        pointB = null;
        startMarker = null;
        destMarker = null;
        location_cordinates = [];
        routes = [];
        locations = [];
        route_num = 1;
        start_point = false;
        end_point = false;
        $('.route_wrapper').empty();
        group.removeAll();
        markerGroup.removeAll();
    }
    //Timer to prevent this block to run too early
    setTimeout(function(){
        function geocode(platform) {

            //Performs twice to cover both search querys
            for (var x = 0; x<2;x++){

                var freetext_1 = document.getElementById('free_text_text_box_1');
                var freetext_2 = document.getElementById('free_text_text_box_2');
                var geocoder = platform.getGeocodingService();
                if (start_point != true) {
                    geocodingParameters = {
                        searchText: freetext_1.value,
                        jsonattributes: 1
                    };
                    start_point = true;
                }

                else if (end_point == false && start_point == true) {
                    geocodingParameters = {
                        searchText: freetext_2.value,
                        jsonattributes: 1
                    };
                    end_point = true;
                }
                geocoder.geocode(
                    geocodingParameters,
                    onSuccess,
                    onError
                );
            }

        }

        //executes after geocoding
        function onSuccess(result) {
            //Logs the locations
            locations = result.response.view[0].result;
            //To prevent loop
            if (start_point || end_point == false) {
                //if null first value is this
                if (location_cordinates == 0) {
                    location_cordinates = [locations];
                    pointA = new H.geo.Point(locations[0].location.displayPosition.latitude, locations[0].location.displayPosition.longitude);
                    startMarker = new H.map.Marker(pointA);
                    markerGroup.addObject(startMarker);


                } else {
                    location_cordinates.push(locations);
                    pointB = new H.geo.Point(locations[0].location.displayPosition.latitude, locations[0].location.displayPosition.longitude);
                    destMarker = new H.map.Marker(pointB);
                    markerGroup.addObject(destMarker);
                    map.setViewBounds(markerGroup.getBounds());


                }
                if (location_cordinates.length == 2){
                    map.addObject(markerGroup);
                    map.setViewBounds(markerGroup.getBounds());

                    //executes next chunk of function
                    tester();

                }
            }
            //resizes' map view
            map.getViewPort().resize();

        }

        function onError(error) {
            alert('Ooops!');
        }


        geocode(platform);




    },500);

}



function initial_map(routes){


    // div counter variable for dynamic id's
    var div_counter = 1;

    //for each route add div containing individual route info
    for (var i in routes){
        $('.route_wrapper')
            .append($("<div>")
                .attr("id","route_div_"+div_counter)
                .data("state", "not_selected")
                .addClass("route")
                //on click that allows div to expand and collapse
                .on("click", function() {
                    if ($(this).data("state") != "selected"){
                        $(this).css("overflow","scroll").animate({"height": "98%"},1000).data("state","selected");
                        for (var q = 0; q < $(".route_wrapper > div").length;q++){
                            var other_route =$(".route_wrapper > div")[q];
                            if ($(other_route).data("state") != "selected" ){
                                $(other_route).hide(1000);
                            }
                        }
                        var unsliced_div_id = $(this).attr("id");
                        var sliced_div = unsliced_div_id.slice(-1);
                        var numerical_val = parseInt(sliced_div);
                        route_info_id = numerical_val - 1;
                        var selected_route = routes[route_info_id];
                        debugger;
                        // add individual route on map
                        addRouteShapeToMap(selected_route);

                    //if already expanded collapse, display all routes on map, along with graph
                    }else if ($(this).data("state") == "selected"){
                        $(this).css("overflow","hidden").animate({"height": "50px"},1000);
                        for (var q = 0; q < $(".route_wrapper > div").length;q++){
                            var other_route =$(".route_wrapper > div")[q];

                            if ($(other_route).data("state") != "selected" ){

                                $(other_route).show(1000);
                            }
                        }
                        $(this).data("state","not-selected");
                        addRouteShapeToMap(response_peek);
                    }
                })
                .append($("<div>")
                    .addClass("route_title_"+div_counter)
                    .html("Route # "+ div_counter))
                .append($("<div>")
                    .attr("id","route_info_div_"+div_counter)
                    .addClass("route_info")));
        div_counter++;
    }
    $('.route_wrapper').append($("<div>").attr("id","container"));

    $(function () {
        var sub_route=0.0;
        var data_values = [];
        var value_set_state = 1;

        //dynamically creates objects to hold 3 pieces of info for every route
        for (var i = 0; i < (routes.length*3);i++){
            var sRfloor = Math.floor(sub_route);
            var current_route_time = parseFloat(routes[sRfloor].summary.converted_time);
            var current_route_cost = parseFloat(routes[sRfloor].cost.totalCost);
            var current_route_avg = 100 - ((routes[sRfloor].summary.converted_time - routes[0].summary.converted_time)/routes[0].summary.converted_time).toFixed(3);

            if (value_set_state == 3){
                data_values[i]= current_route_avg;

                value_set_state = 1;
            }else if(value_set_state == 2){

                data_values[i]= current_route_cost;

                value_set_state ++;
            }else if (value_set_state == 1){

                data_values[i]= current_route_time;

                value_set_state ++;

            }
            sub_route += 0.3333333;

        }


        //dynamic plugging in returned result from here api to highcharts
        if (routes.length == 5) {


            Highcharts.chart('container', {

                chart: {
                    type: 'bubble',
                    plotBorderWidth: 1,
                    zoomType: 'xy'
                },

                legend: {
                    enabled: false
                },

                title: {
                    text: 'Routes Cost/Time'
                },


                xAxis: {
                    gridLineWidth: 1,
                    title: {
                        text: 'Travel Time(Minutes)'
                    },
                    labels: {
                        format: '{value} min.s'
                    },
                    plotLines: []
                },

                yAxis: {
                    startOnTick: false,
                    endOnTick: false,
                    title: {
                        text: 'Cost ($)'
                    },
                    labels: {
                        format: '{value} $'
                    },
                    maxPadding: 0.2,
                    plotLines: []
                },

                tooltip: {
                    useHTML: true,
                    headerFormat: '<table>',
                    pointFormat: '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
                    '<tr><th>Travel Time:</th><td>{point.x}min.</td></tr>' +
                    '<tr><th>Cost:</th><td>${point.y}</td></tr>' +
                    '<tr><th>Percent as Fast Compared To Fastest Route:</th><td>{point.z}%</td></tr>',
                    footerFormat: '</table>',
                    followPointer: true
                },

                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: false
                        },events: {
                            //allows user to click of bubble to trigger a click event on the associated route info div
                            click: function (e) {
                                var div_id = parseInt(event.point.index)+1;
                                var route_div_id = "route_div_" + div_id;
                                var selected_route = document.getElementById(route_div_id);
                                $(selected_route).trigger("click");
                            }
                        }
                    }

                },
                series: [{
                    data: [
                        { x: data_values[0], y: data_values[1], z: data_values[2],  name: 'Route 1', color:routeColor[0] },
                        { x: data_values[3], y: data_values[4], z: data_values[5], name: 'Route 2', color:routeColor[1] },
                        { x: data_values[6], y: data_values[7], z: data_values[8], name: 'Route 3', color:routeColor[2] },
                        { x: data_values[9], y: data_values[10], z: data_values[11], name: 'Route 4', color:routeColor[3] },
                        { x: data_values[12], y: data_values[13], z: data_values[14], name: 'Route 5', color:routeColor[4] }

                    ]
                }]

            })
        }else if (routes.length==4){
            Highcharts.chart('container', {

                chart: {
                    type: 'bubble',
                    plotBorderWidth: 1,
                    zoomType: 'xy'
                },

                legend: {
                    enabled: false

                },

                title: {
                    text: 'Routes Cost/Time'
                },

                subtitle: {
                },

                xAxis: {
                    gridLineWidth: 1,
                    title: {
                        text: 'Travel Time(Minutes)'
                    },
                    labels: {
                        format: '{value} min.s'
                    },
                    plotLines: []
                },

                yAxis: {
                    startOnTick: false,
                    endOnTick: false,
                    title: {
                        text: 'Cost ($)'
                    },
                    labels: {
                        format: '{value} $'
                    },
                    maxPadding: 0.2,
                    plotLines: []
                },

                tooltip: {
                    useHTML: true,
                    headerFormat: '<table>',
                    pointFormat: '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
                    '<tr><th>Travel Time:</th><td>{point.x}min.</td></tr>' +
                    '<tr><th>Cost:</th><td>${point.y}</td></tr>' +
                    '<tr><th>Percent as Fast Compared To Fastest Route:</th><td>{point.z}%</td></tr>',
                    footerFormat: '</table>',
                    followPointer: true
                },

                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: false

                        },
                        events: {
                            click: function (e) {
                                var div_id = parseInt(event.point.index)+1;
                                var route_div_id = "route_div_" + div_id;
                                var selected_route = document.getElementById(route_div_id);
                                $(selected_route).trigger("click");
                            }
                        }
                    },

                },
                series: [{
                    data: [
                        { x: data_values[0], y: data_values[1], z: data_values[2],  name: 'Route 1', color:routeColor[0] },
                        { x: data_values[3], y: data_values[4], z: data_values[5], name: 'Route 2', color:routeColor[1] },
                        { x: data_values[6], y: data_values[7], z: data_values[8], name: 'Route 3', color:routeColor[2] },
                        { x: data_values[9], y: data_values[10], z: data_values[11], name: 'Route 4', color:routeColor[3] }
                    ]
                }]

            })
        }else if (routes.length==3){
            Highcharts.chart('container', {

                chart: {
                    type: 'bubble',
                    plotBorderWidth: 1,
                    zoomType: 'xy'
                },

                legend: {
                    enabled: false
                },

                title: {
                    text: 'Routes Cost/Time'
                },

                subtitle: {
                },

                xAxis: {
                    gridLineWidth: 1,
                    title: {
                        text: 'Travel Time(Minutes)'
                    },
                    labels: {
                        format: '{value} min.s'
                    },
                    plotLines: []
                },

                yAxis: {
                    startOnTick: false,
                    endOnTick: false,
                    title: {
                        text: 'Cost ($)'
                    },
                    labels: {
                        format: '{value} $'
                    },
                    maxPadding: 0.2,
                    plotLines: []
                },

                tooltip: {
                    useHTML: true,
                    headerFormat: '<table>',
                    pointFormat: '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
                    '<tr><th>Travel Time:</th><td>{point.x}min.</td></tr>' +
                    '<tr><th>Cost:</th><td>${point.y}</td></tr>' +
                    '<tr><th>Percent as Fast Compared To Fastest Route::</th><td>{point.z}%</td></tr>',
                    footerFormat: '</table>',
                    followPointer: true
                },

                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: false

                        },
                        events: {
                            click: function (e) {
                                var div_id = parseInt(event.point.index)+1;
                                var route_div_id = "route_div_" + div_id;
                                var selected_route = document.getElementById(route_div_id);
                                $(selected_route).trigger("click");
                            }
                        }
                    },

                },
                series: [{
                    data: [
                        { x: data_values[0], y: data_values[1], z: data_values[2],  name: 'Route 1', color:routeColor[0] },
                        { x: data_values[3], y: data_values[4], z: data_values[5], name: 'Route 2', color:routeColor[1] },
                        { x: data_values[6], y: data_values[7], z: data_values[8], name: 'Route 3', color:routeColor[2] }
                    ]
                }]

            })
        }
    });



    for (i in routes) {
        var route = routes[i];
        var routeInstructionsContainerPre = $('#route_div_'+route_num);
        addRouteShapeToMap(response_peek);
        addWaypointsToPanel(route.waypoint);
        addManueversToPanel(route);
        addSummaryToPanel(route);
        route_num++;
    }

}
function tester() {

    //makes a variable for each specific cordinate
    var location_1_lat = location_cordinates[0][0].location.displayPosition.latitude;
    var location_1_lon = location_cordinates[0][0].location.displayPosition.longitude;
    var location_2_lat = location_cordinates[1][0].location.displayPosition.latitude;
    var location_2_lon = location_cordinates[1][0].location.displayPosition.longitude;

    //api url
    var urlRoutingReq =
        [
            "https://tce.cit.api.here.com" + "/2/calculateroute.json?",
            "jsonAttributes=41",
            "&waypoint0=",
            location_1_lat,
            ",",
            location_1_lon,
            "&detail=3",
            "&waypoint1=",
            location_2_lat,
            ",",
            location_2_lon,
            "&routelegattributes=li&routeattributes=all&maneuverattributes=all&linkattributes=all,rt,fl&legattributes=mn,li,sm&currency=USD&departure=&tollVehicleType=2&trailerType=0&trailersCount=0&vehicleNumberAxles=2&trailerNumberAxles=0&hybrid=0&emissionType=5&height=167&trailerHeight=0&vehicleWeight=3700&limitedWeight=3400&disabledEquipped=0&minimalPollution=0&hov=0&passengersCount=1&tiresCount=4&commercial=0&shippedHazardousGoods=0&heightAbove1stAxle=100&mode=fastest;car;traffic:enabled&rollup=none,country;tollsys&alternatives=4&app_id=inCUge3uprAQEtRaruyaZ8&app_code=9Vyk_MElhgPCytA7z3iuPA&jsonpcallback=parseRoutingResponse"].join("");


    //xml ajax request
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState != 4 && $(".route_wrapper").html().trim()==""){
            var loader_gif = $('<img src="assets/default.gif" alt="Loading" />');
            $('.route_wrapper').append($(loader_gif).addClass("loading"));
            debugger;
        }
        if (this.readyState == 4 && this.status == 200) {
            console.log(this);
            $(".route_wrapper").empty();
            response_peek=this;
            var json_file = response_peek.response;
            json_file= json_file.replace(/parseRoutingResponse\(/,"");
            json_file= json_file.replace(/\)/g,"");
            var new_result = JSON.parse(json_file);
            console.log(new_result);
            response_peek = new_result;
            for (i = 0; i < response_peek.response.route.length;i++){
                if (routes == 0) {
                    routes = [response_peek.response.route[i]]
                } else {
                    routes.push(response_peek.response.route[i])
                }

            }

            //adds a converted time property to each route
            for (var i in routes){
                var pre_convert = routes[i].summary.travelTime;
                var converted_time = Math.floor(pre_convert/60);
                routes[i].summary.converted_time = converted_time;

            }

            //sorts in order of time in prep for chart, and route info div's
            routes = routes.sort(function(a, b) {
                return a.summary.converted_time - b.summary.converted_time;
            });

            //starts creating route objects
            initial_map(routes);
        }
    };
    xhttp.open("GET",urlRoutingReq, true);
    xhttp.send();
};



// create link objects
function addRouteShapeToMap(respr){
    var routeLinkHashMap = new Object(); // key = linkID, value = link object
    group.removeAll();

    //if the argument is a group of lacations
    if (respr.leg == undefined) {
        for (var r = 0; r < routes.length; r++) {


            for (var m = 0; m < routes[r].leg[0].link.length; m++) {
                var strip = new H.geo.Strip(),
                    shape = routes[r].leg[0].link[m].shape,
                    i,
                    l = shape.length;


                for (i = 0; i < l; i += 2) {
                    strip.pushLatLngAlt(shape[i], shape[i + 1], 0);
                }

                var link = new H.map.Polyline(strip,
                    {
                        style: {
                            lineWidth: '8', // alternatives get smaller line with
                            strokeColor: routeColor[r],
                            lineCap: 'butt'
                        }
                    });
                link.setArrows({color: "black", width: 2, length: 3, frequency: 4});
                link.$linkId = routes[r].leg[0].link[m].linkId;

                routeLinkHashMap[(routes[r].leg[0].link[m].linkId.lastIndexOf("+", 0) === 0 ? routes[r].leg[0].link[m].linkId.substring(1) : routes[r].leg[0].link[m].linkId)] = link;
                group.addObject(link);

            }

        }

        map.addObject(group);
        map.setViewBounds(group.getBounds());

    }else{
        for (var m = 0; m < respr.leg[0].link.length; m++) {
            var strip = new H.geo.Strip(),
                shape = respr.leg[0].link[m].shape,
                i,
                l = shape.length;


            for (i = 0; i < l; i += 2) {
                strip.pushLatLngAlt(shape[i], shape[i + 1], 0);
            }
            var selected_color = routeColor[route_info_id];


            var link = new H.map.Polyline(strip,
                {
                    style: {
                        lineWidth: '8', // alternatives get smaller line with
                        strokeColor: selected_color,
                        lineCap: 'butt'
                    }
                });
            link.setArrows({color: "black", width: 2, length: 3, frequency: 4});
            link.$linkId = respr.leg[0].link[m].linkId;

            routeLinkHashMap[(respr.leg[0].link[m].linkId.lastIndexOf("+", 0) === 0 ? respr.leg[0].link[m].linkId.substring(1) : respr.leg[0].link[m].linkId)] = link;
            group.addObject(link);

        }

    }

    map.addObject(group);
    map.setViewBounds(group.getBounds())

}

//next three functions all add info to individual route info div's
function addWaypointsToPanel(waypoints){



    var nodeH3 = document.createElement('h3'),
        waypointLabels = [],
        i;


    for (i = 0;  i < waypoints.length; i += 1) {
        waypointLabels.push(waypoints[i].label)
    }

    nodeH3.textContent = waypointLabels.join(' - ');
    var route_info_div_id = "route_info_div_"+route_num;
    var specified_info_div = document.getElementById(route_info_div_id);
    specified_info_div.innerHTML='';
    specified_info_div.appendChild(nodeH3);
}

function addSummaryToPanel(route){
    var summaryDiv = document.createElement('div'),
        content = '';
    content += '<b>Total distance</b>: ' + Math.floor((route.summary.distance*0.000621371))  + 'mi. <br/>';
    content += '<b>Travel Time</b>: ' + route.summary.travelTime.toMMSS() + ' (in current traffic)<br/>';
    content += "<b>Toll Cost</b>: $" + route.cost.totalCost;

    summaryDiv.style.fontSize = 'small';
    summaryDiv.style.marginLeft ='5%';
    summaryDiv.style.marginRight ='5%';
    summaryDiv.innerHTML = content;
    var route_info_div_id = "route_info_div_"+route_num;
    var specified_info_div = document.getElementById(route_info_div_id);
    specified_info_div.appendChild(summaryDiv);
}
function addManueversToPanel(route){



    var nodeOL = document.createElement('ol'),
        i,
        j;

    nodeOL.style.fontSize = 'small';
    nodeOL.style.marginLeft ='5%';
    nodeOL.style.marginRight ='5%';
    nodeOL.className = 'directions';

    // Add a marker for each maneuver
    for (i = 0;  i < route.leg.length; i += 1) {
        for (j = 0;  j < route.leg[i].maneuver.length; j += 1) {
            // Get the next maneuver.
            var maneuver = route.leg[i].maneuver[j];

            var li = document.createElement('li'),
                spanArrow = document.createElement('span'),
                spanInstruction = document.createElement('span');

            spanArrow.className = 'arrow '  + maneuver.action;
            spanInstruction.innerHTML = maneuver.instruction;
            li.appendChild(spanArrow);
            li.appendChild(spanInstruction);

            nodeOL.appendChild(li);
        }
    }
    var route_info_div_id = "route_info_div_"+route_num;
    var specified_info_div = document.getElementById(route_info_div_id);
    specified_info_div.appendChild(nodeOL);
}




Number.prototype.toMMSS = function () {
    return Math.floor(this / 60) + ' minutes ' + (this % 60) + ' seconds.';
};

