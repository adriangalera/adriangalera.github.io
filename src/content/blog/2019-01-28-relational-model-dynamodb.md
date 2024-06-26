---
heroImage: ../../assets/img/posts/relationalmodel/featured.jpg
category: aws
description: >-
  In this post I implement the persistence of a relational model in DynamoDB.
  Fix some challenges using ECS to perform long running DynamoDB operations
pubDate: 2019-01-28T00:00:00.000Z
tags:
  - aws
  - cloud
  - dynamodb
  - relational
  - persistence
  - ecs
  - python
title: Relational model in DynamoDB
slug: relational-model-dynamodb
---

For a new project that I am starting, I have the requirement to implement a highly relational model in AWS. The most important condition is to keep costs as low as possible, since this is a personal project and I do not want to get poor.

Therefore I will persist the model in DynamoDB configured to use the minimum resources as possible.

The application consist on three entities: User,Map and Points.
Users can create multiple maps that contain several points. The following UML schema explain the relationships:

![Relational model UML](../../assets/img/posts/relationalmodel/estuve-model.png 'Relational model UML')
_Relational model UML_

DynamoDB is a key-value store with support for range key. Thanks to that I am able to implement the following queries:

- CRUD User,Map,Point
- Add a map for one user
- Add a point in a map
- Get points from a map
- Remove map from user
- Remove point from user
- Get maps for a user

## DynamoDB model

**Users table**

The user table is straightforward, the only key is a unique identifier for the user.

```python
{
    "TableName": USER_TABLE,
    "KeySchema": [
        {
            "AttributeName": "user_id",
            "KeyType": "HASH"
        }
    ],
    "AttributeDefinitions": [
        {
            "AttributeName": "user_id",
            "AttributeType": "S"
        }
    ]
}
```

There are additional attributes that keep track of the number of points and maps stored for that user:

```python
record = {
    'user_id': {
        'S': str(obj.user_id)
    },
    'num_points': {
        'N': str(obj.num_points)
    },
    'num_maps': {
        'N': str(obj.num_maps)
    }
}
```

**Maps table**

The map table is a little bit more complex, because it has to keep relations between users and maps. Therefore, I use the range key to save the unique identifier of the map:

```python
{
    "TableName": MAPS_TABLE,
    "KeySchema": [
        {
            "AttributeName": "user_id",
            "KeyType": "HASH"
        },
{
            "AttributeName": "map_id",
            "KeyType": "RANGE"
        },
    ],
    "AttributeDefinitions": [
        {
            "AttributeName": "map_id",
            "AttributeType": "S"
        },
{
            "AttributeName": "user_id",
            "AttributeType": "S"
        }
    ]
}
```

There are additional attributes associated to the map (self-explanatory):

```python
{
    'user_id': {
        'S': str(obj.user_id)
    },
    'map_id': {
        'S': str(obj.map_id)
    },
    'name': {
        'S': str(obj.name)
    },
    'description': {
        'S': str(obj.description)
    },
    'num_points': {
        'N': str(obj.num_points)
    }
}
```

**Points table**

This is most complex table. The keys are similar to the maps, the range key is used to store the unique identifier of the map:

```python
{
    "TableName": POINTS_TABLE,
    "KeySchema": [
        {
            "AttributeName": "map_id",
            "KeyType": "HASH"
        },
        {
            "AttributeName": "point_id",
            "KeyType": "RANGE"
        },
    ],
    "AttributeDefinitions": [
        {
            "AttributeName": "map_id",
            "AttributeType": "S"
        },
        {
            "AttributeName": "point_id",
            "AttributeType": "S"
        },
    ]
}
```

And the additional parameters:

```python
{
    'point_id': {
        'S': obj.point_id
    },
    'map_id': {
        'S': str(obj.map_id)
    },
    'lat': {
        'S': str(obj.lat)
    },
    'lon': {
        'S': str(obj.lon)
    },
    'date': {
        'N': str(obj.epoch)
    },
    'name': {
        'S': str(obj.name)
    },
}
```

The challenge with this model is to be able to delete a map with a large number of points. It is counter-intuitive, because one might think that removing only the points with the primary key of the map will make the work but ... **THIS WILL NOT WORK!**

Due to the way DynamoDB is implemented, this is not possible [https://stackoverflow.com/questions/34259358/dynamodb-delete-all-items-having-same-hash-key](https://stackoverflow.com/questions/34259358/dynamodb-delete-all-items-having-same-hash-key). In that kind of tables, you need to provide the primary key and the range key in order to delete an item.

Since the number of items can be large, it could take a lot of capacity to delete a the points. I do not want to consume that capacity, so I will let DynamoDB throttle the deletes to adapt to the capacity.

The project is serverless (Lambda) based and trying to delete a large number of points will result in timeouts when DynamoDB throttle the deletes. There are two possible solutions here: increase the write capacity of the table (increase cost) or increase the Lambda timeout (increase cost).

After thinking a little bit, the valid solution I choose is to launch an ECS Task with the logic to delete the large number of maps:

```python
client.run_task(
    cluster="arn:aws:ecs:eu-west-1:***:cluster/remove-points-cluster",
    taskDefinition="arn:aws:ecs:eu-west-1:***:task-definition/remove-points",
    overrides={
        "containerOverrides": [
            {
                "name": "remove-points",
                "environment": [
                    {
                        "name": "MAP_ID",
                        "value": map_id
                    }
                ]
            }
        ]
    },
    launchType="FARGATE",
    networkConfiguration={
        "awsvpcConfiguration": {
            "subnets": ["1", "2"],
            "assignPublicIp": "ENABLED"
        }
    }
)
```

The best part of this ECS Task is that only took 5 minutes to use the same code base and Dockerize the logic of removing the points!

Now the long-running task of delete a large number of points is done in ECS, where the pricing model is pay per use. Since this is a feature that is not going to happen a lot, it's perfectly fine.
