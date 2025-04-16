---
heroImage: ../../assets/img/posts/web-worker-vite/gpx-web-worker-featured-image.webp
category: js
description: Prevent UI freezes in your Leaflet GPX app by offloading large file parsing to Web Workers, ensuring smooth user experience.
pubDate: 2025-03-23T23:00:00.000Z
draft: false
tags:
  - gpx
  - vitest
  - test
  - web-worker
  - js
title: Keep the UI responsive by using web worker
---

GPX files, which are XML-based, can be quite large, especially when they contain extensive tracking data. Parsing these files on the main thread can block the UI, causing unresponsiveness during the parsing process.

## Web Workers

Web Workers allow us to run scripts in background threads, separate from the main execution thread of a web application. By offloading the GPX parsing to a Web Worker, we can prevent UI freezes and maintain a smooth user experience.

Here's how I implemented the Web Worker to parse GPX files:

### Create the web worker script

First, I created a separate JavaScript file, gpx-parser-worker.js, which contains the code for parsing the GPX files:

```javascript
self.onmessage = function (event) {
	const gpxData = event.data
	const parser = new DOMParser()
	const xmlDoc = parser.parseFromString(gpxData, 'application/xml')
	const trackPoints = []

	const trkpts = xmlDoc.getElementsByTagName('trkpt')
	for (let i = 0; i < trkpts.length; i++) {
		const trkpt = trkpts[i]
		const lat = parseFloat(trkpt.getAttribute('lat'))
		const lon = parseFloat(trkpt.getAttribute('lon'))
		const ele = parseFloat(trkpt.getElementsByTagName('ele')[0].textContent)
		const time = trkpt.getElementsByTagName('time')[0].textContent
		trackPoints.push({ lat, lon, ele, time })
	}

	self.postMessage(trackPoints)
}
```

In this script, the worker listens for messages containing GPX data, parses the XML to extract track points, and sends the parsed data back to the main thread.

### Integrate the Web Worker in the main thread

In the main JavaScript file of the application, I integrated the Web Worker as follows:

```javascript
// Initialize the Web Worker
const gpxParserWorker = new Worker('gpx-parser-worker.js')

// Handle messages received from the worker
gpxParserWorker.onmessage = function (event) {
	const trackPoints = event.data
	// Process the track points, e.g., add them to the Leaflet map
	addTrackToMap(trackPoints)
}
```

In this setup, the main thread initializes the Web Worker and defines a handler for messages received from the worker. When a GPX file is loaded, its contents are sent to the worker for parsing. Once parsing is complete, the worker sends the parsed track points back to the main thread for further processing, such as rendering them on the Leaflet map.

Since I'm using vite, I needed to change the registration of the web worker a bit:

```javascript
new Worker(new URL('./gpx-worker.js', import.meta.url))
```

Doing it this way, I was able to import the worker without needing any extra config

### Testing

The trick with testing Web Workers is that you don’t spin up an actual thread. Instead, you isolate the parsing logic into a function that can be tested independently.

#### Move the core parsing into a separate module

I created parse-gpx.js to hold the core logic:

```javascript
// parse-gpx.js
export function parseGPX(xmlString) {
	const parser = new DOMParser()
	const xmlDoc = parser.parseFromString(xmlString, 'application/xml')

	return Array.from(xmlDoc.getElementsByTagName('trkpt')).map((pt) => ({
		lat: parseFloat(pt.getAttribute('lat')),
		lon: parseFloat(pt.getAttribute('lon')),
		ele: parseFloat(pt.getElementsByTagName('ele')[0]?.textContent || 0),
		time: pt.getElementsByTagName('time')[0]?.textContent
	}))
}
```

Then, gpx-worker.js simply uses it:

```javascript
import { parseGPX } from './parse-gpx.js'

self.onmessage = (e) => {
	const parsed = parseGPX(e.data)
	self.postMessage(parsed)
}
```

#### Write tests with Vitest

Thanks to [vitest-web-worker module](https://www.npmjs.com/package/@vitest/web-worker 'vitest web worker'), you can use vitest as you'd use it regularly. The only different thing you need to do is just to import and create a new instance of your web worker:

```javascript
import '@vitest/web-worker'
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import GpxParserWorker from '../../../src/parser/trackparser.worker?worker'
import { waitFor } from '@testing-library/dom'

describe('GPX Parser Worker', () => {
	const validGpxData = () => {
		const filePath = path.resolve(__dirname, '../../resources/test-track.gpx')
		return fs.readFileSync(filePath, 'utf-8')
	}

	it('should parse GPX data correctly', async (done) => {
		const worker = new GpxParserWorker()
		let recivedData

		worker.onmessage = function (event) {
			recivedData = event.data
		}

		worker.postMessage({ id: '12345', file: validGpxData() })

		await waitFor(() => {
			expect(recivedData).toEqual([
				{ lat: 48.8588443, lon: 2.2943506 },
				{ lat: 48.859, lon: 2.295 }
			])
		})
	})
})
```

The test reads the contents of a real GPX track, and send them to the worker, then, the test waits for the result of the web worker.

Pay extra attention to the import line:

```javascript
import GpxParserWorker from '../../../src/parser/trackparser.worker?worker'
```

Make sure to include the suffix `?worker`, otherwise `vite` will not recognize the file as a worker and the test will fail.

### Final thoughts

Offloading GPX file parsing to a Web Worker is an effective strategy to maintain UI responsiveness in web applications that handle large GPX files. This method ensures that computationally intensive tasks do not interfere with user interactions, resulting in a smoother and more enjoyable experience.

Got questions or want to see the full code? Drop me a message or check out the [project](https://github.com/adriangalera/estuve 'estuve') on GitHub.
