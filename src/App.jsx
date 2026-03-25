
import { useState, useCallback, useEffect } from 'react';
import Map from './Map';
import Search from './Search';
import './App.css';

const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const center = [-71.05953, 42.36290];

function App() {
  // Origin is fixed
  const origin = [...center];
  // Separate state for each map feature
  const [destination, setDestination] = useState(null); // [lng, lat] or null
  const [entrance, setEntrance] = useState([]); // flat array: [lng1, lat1, lng2, lat2, ...]
  const [route, setRoute] = useState(null);

  // Called when a search result is selected
  const handleSearchResult = useCallback((searchResultFeature) => {
    // Extract destination and entrances
    const coordinates = searchResultFeature.properties?.coordinates;
    let destinationCoordinates;
    let entrancePoints = [];
    if (Array.isArray(coordinates?.routable_points)) {
      const defaultPt = coordinates.routable_points.find(pt => pt.name === 'default');
      if (defaultPt) {
        destinationCoordinates = [defaultPt.longitude, defaultPt.latitude];
      }
      entrancePoints = coordinates.routable_points.filter(pt => pt.name === 'entrance');
    }
    if (!destinationCoordinates) {
      if (typeof coordinates?.longitude === 'number' && typeof coordinates?.latitude === 'number') {
        destinationCoordinates = [coordinates.longitude, coordinates.latitude];
      }
    }
    setDestination((destinationCoordinates && destinationCoordinates.length === 2) ? destinationCoordinates : null);
    setEntrance(entrancePoints.flatMap(pt => [pt.longitude, pt.latitude]));
  }, []);
  // Trigger directions API call when destination changes
  useEffect(() => {
    if (!destination || destination.length !== 2) {
      setRoute(null);
      return;
    }
    const [destLng, destLat] = destination;
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destLng},${destLat}?geometries=geojson&overview=full&access_token=${accessToken}`;
    (async () => {
      try {
        const response = await fetch(directionsUrl);
        let routeFeature = null;
        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.type === 'LineString') {
            routeFeature = {
              type: 'Feature',
              geometry: data.routes[0].geometry,
              properties: {}
            };
          }
        }
        setRoute(routeFeature);
      } catch (err) {
        console.error('Directions fetch failed', err);
      }
    })();
  }, [destination, entrance]);


  // Optionally handle map events (e.g., moveend)
  const handleMapEvent = useCallback(() => {
    // Could update proximity or other state here if needed
  }, []);

  // Handler to clear all map state
  const handleClearSearch = useCallback(() => {
    setDestination(null);
    setEntrance([]);
    setRoute(null);
  }, []);

  // Prepare empty features for cleared state
  const emptyFeature = { type: 'FeatureCollection', features: [] };
  const mapDestination = destination && destination.length === 2 ? destination : null;
  const mapEntrance = entrance && entrance.length > 0 ? entrance : [];
  const mapRoute = route && route.geometry && route.geometry.type === 'LineString' ? route : null;

  return (
    <>
      {/* Floating explanation panel - now top left */}
      <div className="absolute z-40 top-0 left-0 m-6 max-w-md bg-white bg-opacity-95 rounded-lg shadow-lg px-6 py-5 border border-gray-200 text-gray-800 w-1/3">
        <div className="font-bold text-lg mb-2">Entrances & Routable Points Demo</div>
        <div className="text-sm leading-relaxed">
          <p className="mb-2 font-semibold text-blue-800">Try it: Search for an address to see navigation and entrance data in action.</p>
          <p className="mb-2">
            This demo shows how <a href="https://docs.mapbox.com/api/search/geocoding/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">Geocoding API</a> results with entrance locations can be combined with other Mapbox services to create an improved navigation experience.
          </p>
          <p className="mb-2">
            Enter an address to navigate to. If entrance data exists for the address, the map will display both the driving route and the entrance, giving a delivery driver more context about where to go on foot after arriving at the location.
          </p>
          <p>
            Zoom in to the destination area to see the driving destination and entrance points clearly.
          </p>
        </div>
      </div>
        <Search
          accessToken={accessToken}
          proximity={center}
          onSearchResult={handleSearchResult}
          onClear={handleClearSearch}
        />
      {mapRoute && (
        <div className="absolute z-30 left-0 bottom-0 m-6 bg-white bg-opacity-90 rounded-lg shadow px-4 py-3 flex flex-col gap-2 w-fit border border-gray-200">
          <div className="font-semibold text-gray-700 mb-1">Legend</div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-8 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #2F7AC6 0%, #56A8FB 100%)' }}></span>
            <span className="text-sm text-gray-700">Navigation route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-400" style={{ background: '#fff' }}></span>
            <span className="text-sm text-gray-700">Origin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-400" style={{ background: '#56A8FB' }}></span>
            <span className="text-sm text-gray-700">Destination</span>
          </div>
          {mapEntrance && mapEntrance.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-400" style={{ background: '#fecaca' }}></span>
              <span className="text-sm text-gray-700">Entrance</span>
            </div>
          )}
        </div>
      )}
      <Map
        accessToken={accessToken}
        center={center}
        origin={origin}
        destination={mapDestination || []}
        entrance={mapEntrance || []}
        route={mapRoute || emptyFeature}
        onMapEvent={handleMapEvent}
      />
    </>
  );
}

export default App