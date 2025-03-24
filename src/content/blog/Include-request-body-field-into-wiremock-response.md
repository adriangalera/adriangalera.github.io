---
heroImage: /src/assets/img/posts/wiremock-response-request-body/pexels-pixabay-373543.jpg
category: testing
description: How to include request body field in wiremock response
pubDate: 2024-10-15T22:00:00.000Z
tags:
  - testing
  - chatgpt
  - wiremock
title: Echo request body into wiremock response
---

Currently I'm mocking Grafana HTTP API requests and responses into wiremock.

At some point I've got blocked because I wanted to extract one field from request body and return it as a field in the response.

I browsed and browsed Internet and the answer I needed did not pop up, so I've give ChatGPT a try without much hope:

> Hey, I want to use wiremock to mock HTTP response:\
> When I send curl -X POST http\://localhost:9999/api/folders --data '{"title": "invalid-role", "uid":"invalid-role"}'
> I want the response to be {"uid":"invalid-role","title":"invalid-role"}.
> Make it generic so the request body field uid is included in the response in both fields

Surprisingly, ChatGPT came up with a very good answer:

```json
{
	"request": {
		"method": "POST",
		"url": "/api/folders"
	},
	"response": {
		"status": 200,
		"body": "{\"uid\":\"{{jsonPath request.body '$.uid'}}\",\"title\":\"{{jsonPath request.body '$.uid'}}\"}",
		"headers": {
			"Content-Type": "application/json"
		},
		"transformers": ["response-template"]
	}
}
```

Now when I call the wiremock instance:

```shell
curl - X POST http://localhost:9999/api/folders --data '{"uid":"invalid-role"}' -H "Content-Type: application/json"
```

I've got what I need:

```json
{
	"uid": "invalid-role",
	"title": "invalid-role"
}
```

So, all I have to say is..Thanks ChatGPT!
