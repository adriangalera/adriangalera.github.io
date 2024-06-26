---
heroImage: ../../assets/img/posts/wiremock/featured.jpg
category: testing
description: >-
  Mocking external API with wiremock. Prepare a docker-compose bootstrap project
  for wiremock.
pubDate: 2018-11-27T00:00:00.000Z
tags:
  - java
  - testing
  - e2e
  - docker
  - wiremock
title: Mocking external API with wiremock
slug: mocking-external-apis-wiremock
---

What happens when you are developing a component that heavily rely on an external API you do not control? Or even worst, that still does not exist. How could you test your component without connecting the external dependency? When we don't have control over the API that we need to integrate, we need a tool like a "mock server".

This article will discover and provide a bootstrap project for wiremock. More info: <a href="http://wiremock.org/">wiremock.org</a>

Quoting from their website:

> WireMock is a simulator for HTTP-based APIs. Some might consider it a service virtualization tool or a mock server.

At its core is a Java software that receives HTTP requests with some mapped requests to responses.

TL;DR: <a href="https://github.com/adriangalera/docker-compose-wiremock/" target="_blank" rel="noopener">[https://github.com/adriangalera/docker-compose-wiremock/](https://github.com/adriangalera/docker-compose-wiremock/)</a>

## Configuring wiremock

Configuring wiremock only consists on defining the requests to be mocked and the response that should be answered on the presence of the mocked request.

## Docker

One nice way of integrate wiremock with your current testing environment is using it inside docker. There's this project <a href="https://github.com/rodolpheche/wiremock-docker">[https://github.com/rodolpheche/wiremock-docker](https://github.com/rodolpheche/wiremock-docker)</a> that provides the wiremock service to docker.
In order to configure it, you must create the following folder structure:

```shell
.
├── Dockerfile
└── stubs
    ├── __files
    │   └── response.json
    └── mappings
        └── request.json
```

The mappings folder contains all the mocked requests definitions and \_\_files contains the response JSON for the mocked requests as shown before

## Example

Let's say we have an external API developed by another team in the company under the host externalapi.com and is not yet finished. The call that our service needs to perform is externalapi.com/v1/resource/resource1 and will respond:

```json
{
	"hello": "world"
}
```

Let's configure wiremock, so we can start working on our service in parallel with the other team.

- Configure the request mapping

```json
{
	"request": {
		"method": "GET",
		"urlPathPattern": "/v1/resource/([a-zA-Z0-9-\\_]*)"
	},
	"response": {
		"status": 200,
		"bodyFileName": "response.json",
		"headers": {
			"Content-Type": "application/json"
		}
	}
}
```

- Configure the response

```json
{
	"hello": "world"
}
```

- Test it

```shell
docker-compose up --build -d
curl http://localhost:7070/v1/resource/resource1
{
"hello" : "world"
}
```

Yay! It worked!

The only missing point is configure the actual component to point to the mocked server. For example with <a href="https://github.com/Netflix/ribbon">ribbon</a>:

```
externalservice.ribbon.listOfServers=http://localhost:7070
```
