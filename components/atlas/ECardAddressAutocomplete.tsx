/**
 * ECard Address Autocomplete Component
 * Provides address autocomplete using Nominatim (OpenStreetMap)
 * Matches the iOS ECardAddressAutocomplete component
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiMapPin, FiSearch, FiX, FiLoader } from 'react-icons/fi';

interface AddressData {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface Props {
  value: AddressData;
  onChange: (address: AddressData) => void;
  isDark?: boolean;
}

const ACCENT = '#0F8A8A';

export default function ECardAddressAutocomplete({ value, onChange, isDark = false }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showManualFields, setShowManualFields] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const bgColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for addresses using Nominatim
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=us`
      );
      const data: NominatimResult[] = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (result: NominatimResult) => {
    const address = result.address;
    const streetAddress = `${address.house_number || ''} ${address.road || ''}`.trim();
    
    const newAddress: AddressData = {
      address1: streetAddress,
      address2: '',
      city: address.city || address.town || address.village || '',
      state: address.state || '',
      zipCode: address.postcode || '',
      country: address.country || 'USA',
      formattedAddress: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
    
    onChange(newAddress);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setShowManualFields(true);
  };

  // Handle manual field changes
  const handleFieldChange = (field: keyof AddressData, fieldValue: string) => {
    const newAddress = { ...value, [field]: fieldValue };
    
    // Update formatted address
    const parts = [
      newAddress.address1,
      newAddress.address2,
      newAddress.city,
      newAddress.state,
      newAddress.zipCode,
      newAddress.country,
    ].filter(Boolean);
    newAddress.formattedAddress = parts.join(', ');
    
    onChange(newAddress);
  };

  // Clear address
  const handleClear = () => {
    onChange({
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      formattedAddress: '',
      latitude: undefined,
      longitude: undefined,
    });
    setSearchQuery('');
    setShowManualFields(false);
  };

  return (
    <div className="address-autocomplete" ref={containerRef}>
      {/* Search Input */}
      <div className="search-container">
        <div className="search-icon">
          {isSearching ? (
            <FiLoader className="spinner" size={20} color={subtextColor} />
          ) : (
            <FiSearch size={20} color={subtextColor} />
          )}
        </div>
        <input
          type="text"
          placeholder="Search for an address..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className="search-input"
          style={{ backgroundColor: bgColor, color: textColor, borderColor }}
        />
        {(searchQuery || value.address1) && (
          <button className="clear-btn" onClick={handleClear}>
            <FiX size={20} color={subtextColor} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown" style={{ backgroundColor: bgColor, borderColor }}>
          {suggestions.map((result) => (
            <button
              key={result.place_id}
              className="suggestion-item"
              onClick={() => handleSelectSuggestion(result)}
            >
              <FiMapPin size={16} color={ACCENT} />
              <span style={{ color: textColor }}>{result.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Manual Address Fields */}
      {(showManualFields || value.address1) && (
        <div className="manual-fields">
          <div className="field-row">
            <label style={{ color: subtextColor }}>Street Address</label>
            <input
              type="text"
              value={value.address1}
              onChange={(e) => handleFieldChange('address1', e.target.value)}
              placeholder="123 Main Street"
              className="field-input"
              style={{ backgroundColor: bgColor, color: textColor, borderColor }}
            />
          </div>
          
          <div className="field-row">
            <label style={{ color: subtextColor }}>Apt, Suite, Unit</label>
            <input
              type="text"
              value={value.address2}
              onChange={(e) => handleFieldChange('address2', e.target.value)}
              placeholder="Optional"
              className="field-input"
              style={{ backgroundColor: bgColor, color: textColor, borderColor }}
            />
          </div>
          
          <div className="field-group">
            <div className="field-row" style={{ flex: 2 }}>
              <label style={{ color: subtextColor }}>City</label>
              <input
                type="text"
                value={value.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder="City"
                className="field-input"
                style={{ backgroundColor: bgColor, color: textColor, borderColor }}
              />
            </div>
            <div className="field-row" style={{ flex: 1 }}>
              <label style={{ color: subtextColor }}>State</label>
              <input
                type="text"
                value={value.state}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                placeholder="State"
                className="field-input"
                style={{ backgroundColor: bgColor, color: textColor, borderColor }}
              />
            </div>
          </div>
          
          <div className="field-group">
            <div className="field-row" style={{ flex: 1 }}>
              <label style={{ color: subtextColor }}>ZIP Code</label>
              <input
                type="text"
                value={value.zipCode}
                onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                placeholder="ZIP"
                className="field-input"
                style={{ backgroundColor: bgColor, color: textColor, borderColor }}
              />
            </div>
            <div className="field-row" style={{ flex: 1 }}>
              <label style={{ color: subtextColor }}>Country</label>
              <input
                type="text"
                value={value.country}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                placeholder="Country"
                className="field-input"
                style={{ backgroundColor: bgColor, color: textColor, borderColor }}
              />
            </div>
          </div>

          {/* GPS Coordinates */}
          {value.latitude && value.longitude && (
            <div className="coords-display">
              <FiMapPin size={14} color="#34C759" />
              <span style={{ color: subtextColor }}>
                GPS: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Toggle Manual Entry */}
      {!showManualFields && !value.address1 && (
        <button 
          className="manual-toggle"
          onClick={() => setShowManualFields(true)}
        >
          Enter address manually
        </button>
      )}

      <style jsx>{`
        .address-autocomplete {
          position: relative;
          width: 100%;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: 16px 48px;
          border-radius: 12px;
          border: 1px solid;
          font-size: 16px;
          outline: none;
        }

        .search-input:focus {
          border-color: ${ACCENT};
        }

        .clear-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          border-radius: 12px;
          border: 1px solid;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 100;
          max-height: 300px;
          overflow-y: auto;
        }

        .suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          cursor: pointer;
          font-size: 14px;
          line-height: 1.4;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background: rgba(0, 0, 0, 0.03);
        }

        .manual-fields {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .field-row label {
          font-size: 12px;
          font-weight: 500;
        }

        .field-input {
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid;
          font-size: 16px;
          outline: none;
        }

        .field-input:focus {
          border-color: ${ACCENT};
        }

        .field-group {
          display: flex;
          gap: 12px;
        }

        .coords-display {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(52, 199, 89, 0.1);
          border-radius: 8px;
          font-size: 12px;
        }

        .manual-toggle {
          margin-top: 12px;
          padding: 12px;
          background: none;
          border: none;
          color: ${ACCENT};
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
