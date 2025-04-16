---
heroImage: ../../assets/img/posts/wp-docker-map/pexels-pixabay-38271.jpg
category: docker
description: Build a geolocation-enabled WordPress site with Docker Compose. Create a "piulada" category and map posts using custom markers.
pubDate: 2024-10-30T23:00:00.000Z
draft: false
tags:
  - bash
  - php
  - wordpress
  - docker
title: Geolocation wordpress with leaflet
---

## Project Overview

Using Docker Compose, we'll spin up a WordPress and MySQL environment. A custom post-installation script will automatically create the "piulada" category and populate posts with latitude and longitude fields. Then, with a custom page template, we'll visualize these posts on a map using Leaflet.

## Prerequisites

Before we start, ensure you have:

- Docker installed on your machine
- Docker Compose installed

## Project Structure

To keep things organized, we’ll set up our project structure as follows:

```
├── Makefile
├── README.md
├── custom-functions
│   ├── add-location.map.php
│   └── install.sh
├── docker-compose.yml
└── wp-post-installation-script.sh
```

Now, let’s go through each file.

### docker-compose.yml

The docker-compose.yml file configures two services:

- wordpress: Our WordPress application, using a custom Dockerfile.
- db: A MySQL database.

This file also mounts persistent volumes for both WordPress and MySQL data.

```yaml
services:
  db:
    image: mysql: 5.7
    container_name: wordpress-db
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wp_user
      MYSQL_PASSWORD: wp_password
      MYSQL_ROOT_PASSWORD: root_password
    volumes:
      - mysql_data: /var/lib/mysql
    platform:
      linux/amd64
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 5s
      retries: 10

  wordpress:
    image: wordpress: latest
    container_name: wordpress
    depends_on:
      db:
        condition: service_healthy
    environment:
      WORDPRESS_DB_HOST: db: 3306
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_DB_USER: wp_user
      WORDPRESS_DB_PASSWORD: wp_password
    volumes:
      - wp:/var/www/html
      - ./plugins:/plugins
      - ./custom-functions:/custom-functions
    ports:
      - "8080:80"
    platform:
      linux / amd64

volumes:
  mysql_data:
  wp:

```

### custom-functions/add-location.map.php

This file contains the PHP code that queries the post to find the ones that have the lat and lng fields. Once retrieved it iterates over them and create markers in a leaflet map. It also initializes the required scripts:

```php
function enqueue_leaflet_scripts() {
    wp_enqueue_style('leaflet-css', 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css');
    wp_enqueue_script('leaflet-js', 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js', [], null, true);
}
add_action('wp_enqueue_scripts', 'enqueue_leaflet_scripts');

function add_map_with_post_markers() {
    // Start building the output in a variable
    $output = '';
    $args = array(
        'post_type' => 'post',
        'meta_query' => array(
            array(
                'key' => 'lat',
                'compare' => 'EXISTS',
            ),
            array(
                'key' => 'lng',
                'compare' => 'EXISTS',
            )
        )
    );
    $query = new WP_Query($args);

    if ($query->have_posts()) {
        $output .= '<div id="map" style="height: 500px; width: 100%;"></div>';
        $output .= '<script type="text/javascript">
                document.addEventListener("DOMContentLoaded", function() {
                    var map = L.map("map").setView([0, 0], 2);
                    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        maxZoom: 19,
                        attribution: "© OpenStreetMap"
                    }).addTo(map);
        ';

        // Add each post marker
        while ($query->have_posts()) {
            $query->the_post();
            $lat = get_post_meta(get_the_ID(), 'lat', true);
            $lng = get_post_meta(get_the_ID(), 'lng', true);
            $title = get_the_title();
            $url = get_permalink();
            if ($lat && $lng) {
                $output .= "L.marker([$lat, $lng]).addTo(map)
                            .bindPopup('<a href=\"$url\">$title</a>');";
            }
        }

        $output .= '   });
            </script>';

        wp_reset_postdata();
    } else {
        $output .= 'No posts found with coordinates.';
    }

    // Return the output so it appears in the right place
    return $output;
}
add_shortcode('map_with_markers', 'add_map_with_post_markers');

```

All the logic to create the map displaying the post is handled here. It is creating a short code \[map_with_markers] that will embed the map in the page where the user wants to use it.

### custom-functions/add-location.map.php

```shell
#!/bin/bash
cat /custom-functions/add-location.map.php >> /var/www/html/wp-content/themes/twentytwentyfour/functions.php
```

Very hacky way of installing our customer logic into the default wordpress theme.

### wp-post-installation-script.sh

Handles all the automations thanks to wp-cli:

```shell
#!/bin/bash

# Wait until WordPress is accessible
echo "Waiting for WordPress to be available..."
until curl -s http://localhost:8080/wp-admin/install.php &> /dev/null
do
  sleep 5
  echo "..."
done

echo "WordPress is accessible, proceeding with setup..."

# Run WordPress CLI commands inside the container
# Install wp-cli
docker exec wordpress curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar &&
docker exec wordpress chmod +x wp-cli.phar &&
docker exec wordpress mv wp-cli.phar /usr/local/bin/wp
# Install wordpress with the specified user
docker exec wordpress wp core install \
  --url="http://localhost:8080" \
  --title="My WordPress Site" \
  --admin_user="test" \
  --admin_password="test" \
  --admin_email="test@test.com" \
  --skip-email \
  --allow-root

# Append custom code into functions.php
docker exec wordpress /custom-functions/install.sh

# Create post category
docker exec wordpress wp term create category piulada --allow-root

# Create some posts with lat,lng fields
docker exec wordpress wp post create --allow-root --post_type=post --post_status=publish --post_title='Balandrau' --post_content="Balandrau" --post_category="piulada" --meta_input='{"lat":"42.369949953134366","lng":"2.2196442967547165"}'
docker exec wordpress wp post create --allow-root --post_type=post --post_status=publish --post_title='Aneto' --post_content="Aneto" --post_category="piulada" --meta_input='{"lat":"42.63089966977185","lng":"0.656174006128023"}'
docker exec wordpress wp post create --allow-root --post_type=post --post_status=publish --post_title="Pica d'Estats" --post_content="Pica d'Estats" --post_category="piulada" --meta_input='{"lat":"42.66689037852365","lng":"1.3979348714672448"}'

# Create the page that displays the piulades
docker exec wordpress wp post create --allow-root --post_type=page --post_status=publish --post_title="Totes les piulades" --post_content="[map_with_markers]"

# Install the advanced custom fields.
# This is not strictly required to prove the feature, it is necessary so that normal users
# can see the lat,lng metadata fields in the post
docker exec wordpress wp plugin install /plugins/advanced-custom-fields.zip --activate --allow-root

# Make our map page to the frontpage
docker exec wordpress wp option update show_on_front 'page' --allow-root
docker exec wordpress wp option update page_on_front 7 --allow-root

echo "WordPress setup completed successfully! You can find the page here: http://localhost:8080"
```

## Summary

With this setup, we have a WordPress site powered by Docker Compose, MySQL, and a custom map template that uses Leaflet. The "piulada" category allows users to add geolocated posts, displayed interactively on an OpenStreetMap map. This setup can be expanded in many ways, such as enabling users to input their own geolocation data for each post.

Let me know if you found this useful, or if you have any questions about expanding this project!
