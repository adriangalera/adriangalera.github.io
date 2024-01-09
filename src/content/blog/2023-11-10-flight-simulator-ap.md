---
slug: flight-simulator-ap
heroImage: /src/assets/img/posts/gal-ap/featured-image.png
category: maker
description: >-
  In this post I describe how I created from scrach a physical controller for
  autopilot in flight simulators.
pubDate: 2023-11-10T00:00:00.000Z
tags:
  - flight-sim
  - maker
  - electronics
  - arduino
  - mobiflight
title: Custom built autopilot for flight simulators
---

My 3D printer was a little bit bored, long time without anything to print.

Recently, I was playing the tutorials of FSX and MSFS2020, so I decided to join both things into one and create a physical device to control the autopilots.

Let's make it!

## Before starting

I checked if there's something already built to achieve this and I found this wonderful DIY project which served as inspiration: [Vizix Autopilot](https://jeffrlatham.wixsite.com/vizix/autopilot)

When you deep dive a little bit on the topic, you discover that everything there is backed up by [Mobiflight project](https://www.mobiflight.com/en/index.html).

This project setups an Arduino board to send/receive control commands to Flight simulators: FSX, MSFS2020, X-Plane, etc...

## What do we want to control?

We are trying to mimic a real airplane autopilot panel. For example this is the autopilot panel for a Boeing 777:

![](/src/assets/img/posts/gal-ap/autopilot-panel.jpeg)

We want to be able to control AP values such as: speed, heading, altitude, vertical speed, etc... We want to have buttons to enable/disable controls, encoders to setup the values and 7-segments to visualize the values.

In a real airplane, this is a very long component. However, due to the limitations of my 3D printer, I decided to stack the components in more than one row.

## Bill of materials

From here, we can compile the list of materials that we would need:

- 1x [Arduino Mega board](https://www.amazon.es/gp/product/B06Y3ZHPWC/ref=ppx_yo_dt_b_asin_title_o07_s02?ie=UTF8&psc=1)
- 8x [Switch with LED](https://www.amazon.es/gp/product/B09XX69L1W/ref=ppx_yo_dt_b_asin_title_o07_s02?ie=UTF8&psc=1). It's important to search for auto-blocking switch because we want to persist the state (enabled/disabled).
- 4x [Rotary encoder with push button](https://www.amazon.es/gp/product/B07B68H6R8/ref=ppx_yo_dt_b_asin_title_o08_s00?ie=UTF8&psc=1)
- 3x [7-segments display MAX7219](https://www.amazon.es/gp/product/B07D8ZC7Q3/ref=ppx_yo_dt_b_asin_title_o09_s00?ie=UTF8&psc=1). Mobiflight software is only [compatible](https://www.mobiflight.com/en/tutorials/seven-segment-display.html) with `MAX7219`
- 1x [Breadboard](https://www.amazon.es/gp/product/B07CYW8V3Q/ref=ppx_yo_dt_b_asin_title_o09_s00?ie=UTF8&psc=1). To help with 5V and GND connections

## Mobiflight

Once we got all the materials and after a bit of soldering, we can start trying out the configuration of Mobiflight.

The developers of Mobiflight have compiled a very nice set of examples on how to connect multiple hardware:

- [LED connection](https://www.mobiflight.com/en/tutorials/led-parking-brake.html): we can use this example to connect one switch LED light to display if the parking brake is enabled or disabled.
- [Switch](https://www.mobiflight.com/en/tutorials/switch-parking-brake.html): the previous example powers a LED when the parking break is on. In this example we use the switch to set or un-set the parking break (and the LED).
- [7-segment display](https://www.mobiflight.com/en/tutorials/seven-segment-display.html). We can use this example to show `COM1` Radio frequency in the 7-segments display. This is by far the most challenging part. When you connect the 7-segment display, you need to restart the Arduino board and the Mobiflight software; I think this cause because there are some issues with the 7-segments and initialization of the Arduino board.

It was a little bit difficult to troubleshoot the connection issues when soldering the cables. In order to let Mobiflight out of the equation to discard issues with 7-segments, I found [this tutorial](https://www.instructables.com/MAX7219-7-Segment-Using-Arduino/) where the 7-segments is configured directly into the board.

Once I soldered the cables I first run this little Arduino program to confirm all the connections worked fine, once confirmed I configured Mobiflight.

## 3D Printing

This phase really depends on the features of your 3D printer. In mine I couldn't print a much wider component, therefore I decided to stack the components in some rows.

To design the components, I used [tinkercad](https://www.tinkercad.com/) which is free and very convenient to use to design 3D components.

I split the whole component in two parts: the front cover and the box. The components will be connected using bolts.

![3D design](/src/assets/img/posts/gal-ap/3d.png '3D design')

The box has a small hole that fits the Arduino USB port and it's used to power up the device and to connect it to the PC.

The box took 24h to print and the cover was 4-5h aprox. Given the amount of time to print, it was very useful to work on every type of hole separately: it was a matter of 5 minutes to make a small print to test each hole.

## Connections

### Do small tests

I'm a software developer, so I'm used to do small tests to test my software, so I applied the same concept here.

Whenever I solder some device (the LED button or the 7-segment display), first I do a small test to make sure the device works.

### Be very organized

The amount of cables that this project has is huge!

![Cables](/src/assets/img/posts/gal-ap/cables.jpeg 'Cables')

The only way to make this work is to be very organized and define a color code for the cables.

Besides that, keep a note of where you connect each device pin to each Arduino board pin because you'll need it to configure Mobiflight.

You can check how it's done in my case [here](https://drive.google.com/file/d/1QG7TAg5hI28pMcZRbFPaJpJ_N23UZQ5Z/view?usp=sharing)

## Testing, testing, 1, 2

This is the result of all devices connected to Mobiflight in test mode:

<video width="1200" height="400" controls>
  <source src="/posts/gal-ap/video.mp4" type="video/mp4">
Your browser does not support the video tag.
</video>
