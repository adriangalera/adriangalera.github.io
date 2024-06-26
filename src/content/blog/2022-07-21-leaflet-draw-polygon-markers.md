---
slug: leaflet-draw-polygon-markers
heroImage: ../../assets/img/posts/draw-polygon-markers/featured-image.jpg
category: js
description: >-
  I want to add some markers to the map and to create a polygon that joins them
  to display them nicely in a leaflet map
pubDate: 2022-07-21T00:00:00.000Z
tags:
  - leaflet
  - javascript
  - browser
  - gis
title: Draw a polygon from markers in leaflet
---

Following up from the previous article about implementing the fog of war in leaflet, I want to add some markers to the map and to create a polygon that joins them.

Let's see how I manage to do that.

This is part of my series of articles about leaflet:

- <a href="/leaflet-fog-of-war">Leaflet fog of war</a>
- <a href="/leaflet-draw-polygon-markers">Draw a polygon from markers in leaflet</a>
- <a href="/leaflet-load-gpx">Load and display GPX in leaflet</a>
- <a href="/browser-storage">Browser storage</a>

The user can click the map to generate markers that follow a route, e.g. a road, a trail, etc.. and later join those markers to create a complex polygon. This reflects the fact that you have visited the road, but you only have certain visibility of the environment (maybe 10 meters or so):

![Markers](../../assets/img/posts/draw-polygon-markers/1.png 'Markers')
Markers
![Joined markers into a polygon](../../assets/img/posts/draw-polygon-markers/2.png 'Joined markers into a polygon')
Joined markers into a polygon

## Join markers into a polygon

When a new marker is added, it is added to the map and to an internal array:

```javascript
        onAdd: function (e) {
            const marker = new L.Marker(e.latlng)
            container.markers.push(marker.addTo(map))
        }
```

When the user click on a button, those markers are processed and joined into a polygon by using the <a href="https://github.com/bjornharrtell/jsts">jsts</a> library

```javascript
const _joinLinesInPolygon = (points) => {
	const pointToGeomCoordinate = (p) => {
		if (p.lat && p.lng) return new jsts.geom.Coordinate(p.lat, p.lng)
		return new jsts.geom.Coordinate(p[0], p[1])
	}

	const toLeafletPoint = (p) => {
		return [p.x, p.y]
	}

	const meters = 40 //the user can selected the width of the generated polygon
	const distance = (meters * 0.0001) / 111.12 //Geometry aproximations
	const geometryFactory = new jsts.geom.GeometryFactory()
	const pathCoords = points.map((p) => pointToGeomCoordinate(p))
	const shell = geometryFactory.createLineString(pathCoords)
	const polygon = shell.buffer(distance)
	const polygonCoords = polygon.getCoordinates()
	return polygonCoords.map((coord) => toLeafletPoint(coord))
}
```

This method converts the leaflet points into a format the jsts libray can understand and perform the `buffer` operation in jsts which does all the magic. From the API definition: buffer computes a buffer area around this geometry having the given width.

Later the coordinates are transformed into the leaflet format.

Here you can see it in action: <a href="https://www.agalera.eu/leaflet-fogofwar/" target="_blank" rel="noopener">[https://www.agalera.eu/leaflet-fogofwar/](https://www.agalera.eu/leaflet-fogofwar/)</a>
