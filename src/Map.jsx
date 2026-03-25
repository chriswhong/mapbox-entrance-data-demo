
import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Helper: generate a smooth curve (quadratic Bezier) as GeoJSON LineString between two [lng,lat] points
function generateCurve(start, end) {
    const [x1, y1] = start;
    const [x2, y2] = end;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const minOffset = 0.00005;
    const offset = Math.max(0.04 * len, minOffset);
    const ox = -dy / len * offset;
    const oy = dx / len * offset;
    const cx = mx + ox;
    const cy = my + oy;
    const steps = 32;
    const coords = [];
    for (let t = 0; t <= 1; t += 1 / steps) {
        const xt = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
        const yt = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
        coords.push([xt, yt]);
    }
    return {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {}
    };
}

const Map = ({ accessToken, center, origin, destination, entrance, route, onMapEvent }) => {
    const mapRef = useRef();
    const mapContainerRef = useRef();

    // Initialize map only once
    useEffect(() => {
        mapboxgl.accessToken = accessToken;
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            center: center,
            zoom: 13,
        });

        mapRef.current.on('load', () => {
            // Add empty sources
            const sources = [
                { id: 'origin', type: 'Point' },
                { id: 'route', type: 'LineString' },
                { id: 'destination', type: 'Point' },
                { id: 'entrances', type: 'Point' },
                { id: 'walking-curve', type: 'LineString' },
            ];
            sources.forEach(({ id }) => {
                if (!mapRef.current.getSource(id)) {
                    mapRef.current.addSource(id, {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] },
                    });
                }
            });

            if (!mapRef.current.getLayer('route-outline')) {
                mapRef.current.addLayer({
                    id: 'route-outline',
                    type: 'line',
                    source: 'route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: {
                        'line-color': '#2F7AC6',
                        'line-width': [
                            'interpolate', ['linear'], ['zoom'],
                            10, 6,
                            16, 18
                        ],
                        'line-opacity': 0.5,
                    },
                });
            }
            if (!mapRef.current.getLayer('route')) {
                mapRef.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: {
                        'line-color': '#56A8FB',
                        'line-width': [
                            'interpolate', ['linear'], ['zoom'],
                            10, 3,
                            16, 12
                        ],
                        'line-opacity': 0.5,
                    },
                });
            }

            if (!mapRef.current.getLayer('walking-curve')) {
                mapRef.current.addLayer({
                    id: 'walking-curve',
                    type: 'line',
                    source: 'walking-curve',
                    layout: { 'line-cap': 'round', 'line-join': 'round' },
                    paint: {
                        'line-color': '#001f5b',
                        'line-width': 3,
                        'line-dasharray': [2, 4],
                        'line-opacity': 0.8,
                    },
                });
            }

            // add points layers 
            if (!mapRef.current.getLayer('origin')) {
                mapRef.current.addLayer({
                    id: 'origin',
                    type: 'circle',
                    source: 'origin',
                    paint: {
                        'circle-radius': 10,
                        'circle-color': '#fff',
                        'circle-stroke-color': '#888',
                        'circle-stroke-width': 2,
                    },
                });
            }

            if (!mapRef.current.getLayer('destination')) {
                mapRef.current.addLayer({
                    id: 'destination',
                    type: 'circle',
                    source: 'destination',
                    paint: {
                        'circle-radius': 10,
                        'circle-color': '#ccc',
                        'circle-stroke-color': '#888',
                        'circle-stroke-width': 2,
                    },
                });
            }
            if (!mapRef.current.getLayer('entrances')) {
                mapRef.current.addLayer({
                    id: 'entrances',
                    type: 'circle',
                    source: 'entrances',
                    paint: {
                        'circle-radius': 8,
                        'circle-color': '#fecaca',
                        'circle-stroke-color': '#888',
                        'circle-stroke-width': 2,
                    },
                });
            }

        });

        // Listen for map events
        if (onMapEvent) {
            mapRef.current.on('moveend', () => {
                onMapEvent(mapRef.current.getCenter());
            });
        }

        return () => {
            if (mapRef.current) mapRef.current.remove();
        };
    }, []);

    // Fit map to route bounds when route changes
    useEffect(() => {
        if (!mapRef.current || !route || !route.geometry || !route.geometry.coordinates || route.geometry.coordinates.length === 0) return;
        // route.geometry.coordinates is an array of [lng, lat] pairs
        const coords = route.geometry.coordinates;
        // Compute bounds
        const bounds = coords.reduce((b, coord) => {
            return b.extend(coord);
        }, new mapboxgl.LngLatBounds(coords[0], coords[0]));
        mapRef.current.fitBounds(bounds, { padding: 100, duration: 800 });
    }, [route]);

    // Update sources when props change
    useEffect(() => {
        if (!mapRef.current) return;
        // Prepare features
        const originFeature = {
            type: 'Feature', geometry: { type: 'Point', coordinates: origin }, properties: {}
        };
        const destinationFeature = (destination && destination.length === 2)
            ? { type: 'Feature', geometry: { type: 'Point', coordinates: destination }, properties: {} }
            : null;
        const entranceFeatureCollection = {
            type: 'FeatureCollection',
            features: (entrance && entrance.length > 0)
                ? Array.from({ length: entrance.length / 2 }, (_, i) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [entrance[i * 2], entrance[i * 2 + 1]] },
                    properties: {}
                }))
                : []
        };
        // Calculate walking curves
        let walkingCurves = [];
        if (destination && destination.length === 2 && entrance && entrance.length > 0) {
            for (let i = 0; i < entrance.length; i += 2) {
                walkingCurves.push(generateCurve(destination, [entrance[i], entrance[i + 1]]));
            }
        }
        const walkingCurveFeatureCollection = {
            type: 'FeatureCollection',
            features: walkingCurves
        };
        // Update sources
        const sourceData = {
            origin: originFeature,
            route,
            destination: destinationFeature || { type: 'FeatureCollection', features: [] },
            entrances: entranceFeatureCollection,
            'walking-curve': walkingCurveFeatureCollection,
        };
        Object.entries(sourceData).forEach(([key, data]) => {
            if (mapRef.current.getSource(key)) {
                mapRef.current.getSource(key).setData(data);
            }
        });
    }, [origin, destination, entrance, route]);

    return <div id="map-container" ref={mapContainerRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default Map;
