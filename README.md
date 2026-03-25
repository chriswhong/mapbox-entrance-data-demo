# Mapbox Entrances & Routable Points Demo

This project demonstrates how to combine the Mapbox Geocoding API (with the `entrances` parameter) and the Mapbox Directions API to create a navigation experience that highlights both routable points and building entrances for delivery and last-meter navigation scenarios.

## Features

- **Search for an address** using the Mapbox Geocoding API with the `entrances` parameter enabled.
- **Visualize routable points and entrances**: If available, both the navigation destination (routable point) and entrance locations are shown on the map.
- **Driving route** is calculated using the Mapbox Directions API and displayed from a fixed origin to the selected destination.
- **Legend and UI panels** explain the meaning of each map symbol and how the demo works.
- **Responsive, modern UI** built with React, Vite, and Tailwind CSS.
- **Deployable to GitHub Pages** (see below).

## How it works

1. Enter an address in the search bar (top right). The app queries the Mapbox Geocoding API with the `entrances` parameter.
2. If the address has routable points and/or entrances, these are returned in the API response.
3. The app displays the navigation route to the routable point (if available) and marks the entrance(s) on the map.
4. The legend explains the meaning of each symbol. Zoom in to see the entrance and destination points clearly.

## Prerequisites

- Node.js v18.20 or higher
- npm
- A Mapbox access token ([get one here](https://account.mapbox.com/))

## Getting Started

1. Clone this repository and navigate to the project directory:
   ```sh
   git clone https://github.com/chriswhong/mapbox-entrance-data-demo.git
   cd mapbox-entrance-data-demo
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and add your Mapbox access token:
   ```sh
   echo "VITE_MAPBOX_ACCESS_TOKEN=YOUR_MAPBOX_ACCESS_TOKEN" > .env
   ```
4. Start the development server:
   ```sh
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

This project is configured to deploy automatically to GitHub Pages using GitHub Actions. The Vite `base` is set to `/mapbox-entrance-data-demo/` for correct asset paths.

- On every push to `main`, the app is built and deployed to the `gh-pages` branch.
- The site will be available at: `https://chriswhong.github.io/mapbox-entrance-data-demo/`

## Useful Links

- [Mapbox Geocoding API docs](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox Directions API docs](https://docs.mapbox.com/api/navigation/directions/)
- [Mapbox GL JS docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Mapbox Account & Access Tokens](https://account.mapbox.com/)

---

© 2026 Chris Whong. Built with React, Vite, and Mapbox GL JS.
