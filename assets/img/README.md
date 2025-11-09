# PWA Icons

This directory should contain PWA icons in the following sizes:

## Required Icon Sizes

- **icon-72.png** - 72x72px
- **icon-96.png** - 96x96px
- **icon-128.png** - 128x128px
- **icon-144.png** - 144x144px (Microsoft Tile)
- **icon-152.png** - 152x152px (Apple Touch Icon)
- **icon-192.png** - 192x192px (Standard PWA icon)
- **icon-384.png** - 384x384px
- **icon-512.png** - 512x512px (Maskable icon)

## How to Generate Icons

You can use online tools or command-line utilities to generate these icons from your logo:

### Option 1: Using ImageMagick (Command Line)

```bash
# Convert your logo to different sizes
convert logo.png -resize 72x72 icon-72.png
convert logo.png -resize 96x96 icon-96.png
convert logo.png -resize 128x128 icon-128.png
convert logo.png -resize 144x144 icon-144.png
convert logo.png -resize 152x152 icon-152.png
convert logo.png -resize 192x192 icon-192.png
convert logo.png -resize 384x384 icon-384.png
convert logo.png -resize 512x512 icon-512.png
```

### Option 2: Using Online Tools

- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

## Screenshots

Also add application screenshots:

- **screenshot-desktop.png** - 1280x720px (Desktop view)
- **screenshot-mobile.png** - 540x720px (Mobile view)

These screenshots will be shown when users install the PWA.

## Current Status

Currently using placeholder favicon.svg. Replace with actual branded icons for production.
