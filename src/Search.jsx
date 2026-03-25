import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark, faCar, faDoorOpen, faSpinner } from '@fortawesome/free-solid-svg-icons';

const Search = ({ accessToken, proximity, onSearchResult, onClear }) => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setError(null);
    // Don't clear results immediately; keep them visible while loading
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: value,
          entrances: 'true',
          access_token: accessToken,
        });
        if (proximity && Array.isArray(proximity) && proximity.length === 2) {
          params.append('proximity', proximity.join(','));
        }
        const url = `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const res = await response.json();
        setResults(res.features || []);
      } catch {
        setError('Error fetching results');
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (feature) => {
    setInput(feature.properties.full_address || feature.properties.name);
    setResults([]);
    if (onSearchResult) onSearchResult(feature);
  };

  return (
    <div className="absolute z-30 top-6 right-6 w-[400px] flex flex-col items-center">
      <div className="w-full max-w-xl">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </span>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Search for a place..."
            className={`w-full pl-10 pr-10 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 shadow ${results.length > 0 ? 'rounded-t-lg' : 'rounded-lg'}`}
          />
          {input && (
            loading ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin">
                <FontAwesomeIcon icon={faSpinner} />
              </span>
            ) : (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                onClick={() => {
                  setInput('');
                  setResults([]);
                  if (onClear) onClear();
                }}
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )
          )}
        </div>
        {/* Loading state is now a spinner in the input, not a separate box */}
        {error && <div className="bg-white border-x border-b border-gray-300 rounded-b-lg px-4 py-2 text-sm text-red-500">{error}</div>}
        {results.length > 0 && (
          <ul className="bg-white border-x border-b border-gray-300 rounded-b-lg shadow max-h-72 overflow-y-auto">
            {results.map((feature) => {
              const coordinates = feature.properties?.coordinates;
              let hasDefault = false;
              let hasEntrance = false;
              let hasRoutable = false;
              if (Array.isArray(coordinates?.routable_points)) {
                hasDefault = coordinates.routable_points.some(pt => pt.name === 'default');
                hasEntrance = coordinates.routable_points.some(pt => pt.name === 'entrance');
                hasRoutable = coordinates.routable_points.length > 0;
              }
              return (
                <li
                  key={feature.id}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                  onClick={() => handleSelect(feature)}
                >
                  <div>{feature.properties.full_address || feature.properties.name}</div>
                  <div className="flex items-center gap-3 mt-1">
                    {hasDefault && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <FontAwesomeIcon icon={faCar} className="text-gray-400 text-xs" title="Default routable point" />
                        routable
                      </span>
                    )}
                    {hasEntrance && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <FontAwesomeIcon icon={faDoorOpen} className="text-gray-400 text-xs" title="Entrance routable point" />
                        has entrance data
                      </span>
                    )}
                    {!hasRoutable && (
                      <span className="text-xs text-gray-400">No routable Points</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;
