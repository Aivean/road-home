#!/usr/bin/env node

var origin = null
var destination = null
var apiKey = null

for (var i = process.argv.length - 1; i > 0; i--) {

	var key = process.argv[i - 1]
	var value = process.argv[i]

	if (key == "-o") {
		origin = value
	} else if (key == "-d") {
		destination = value
	} else if (key == "-key") {
		apiKey = value
	}
}

if (!origin) {
	console.error("Origin is required (-o)")
}

if (!destination) {
	console.error("Destination is required (-d)")
}

if (!apiKey) {
	console.error("BING Maps API key is required (-key)")
}

if (!origin || !destination || !apiKey) {
	console.log("-------------")
	console.log("Usage:")
	console.log('-o "Origin address (any format recognized by bing)"')
	console.log('-d "Destination address (any format recognized by bing)"')
	console.log('-key "Bing Maps API key (get it here: https://www.bingmapsportal.com/Application)"')
	process.exit(1)
}


var http = require('http')

var options = {
	host: 'dev.virtualearth.net',
	path: '/REST/V1/Routes/Driving?wp.0=' + encodeURIComponent(origin) +
	"&wp.1=" + encodeURIComponent(destination) +
	"&key=" + encodeURIComponent(apiKey) +
	"&ra=excludeItinerary&maxSolns=3&optmz=timeWithTraffic"
}

callback = function (response) {
	var str = ''

	response.on('data', function (chunk) {
		str += chunk
	})

	response.on('end', function () {
		var json = JSON.parse(str)
		var routes = json.resourceSets[0].resources

		for (var i = 0; i < routes.length; i++) {
			if (i != 0) {
				console.log("--------------")
			}

			var route = routes[i]
			var descr = route.routeLegs[0].description
			var timeUnit = route.durationUnit
			var congestion = route.trafficCongestion
			var duration = route.travelDuration
			var trafficDuration = route.travelDurationTraffic

			function formatDuration(d) {
				if (timeUnit == "Second") {
					var s = d % 60
					d = Math.floor(d / 60)
					var m = d % 60
					d = Math.floor(d / 60)
					var h = d

					var res = ""

					function add(s) {
						if (res == "") res += s
						else res += " " + s
					}

					if (h > 0) add(h + "h")
					if (m > 0) add(m + "m")
					if (s > 0 && h == 0 && m < 5) add(s + "s")

					return res
				} else {
					return d + " " + timeUnit
				}
			}

			var traffic = ""
			if (congestion == "None") {
				traffic = "without traffic"
			} else {
				traffic = "in " + congestion + " traffic"
			}

			var color = "\033[0m"
			var trafficRatio = trafficDuration / duration

			if (trafficRatio >= 2) {
				color = "\033[31m"
			} else if (trafficRatio >= 1.8) {
				color = "\033[1;91m"
			} else if (trafficRatio >= 1.6) {
				color = "\033[1;33m"
			} else if (trafficRatio >= 1.4) {
				color = "\033[1;92m"
			} else {
				color = "\033[1;32m"
			}

			console.log(descr + "  " + color + formatDuration(trafficDuration) + " " + traffic + "\033[0m (" + formatDuration(duration) + " w/o traffic)")
		}
	})
}

http.request(options, callback).end()