/**
 * Map Layer Settings Page
 * Allows users to change the default map layer
 * Following Tavvy V2 design system
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';

interface MapLayer {
  id: string;
  name: string;
  description: string;
}

const mapLayers: MapLayer[] = [
  { id: 'standard', name: 'Standard', description: 'Default map view with streets and landmarks' },
  { id: 'satellite', name: 'Satellite', description: 'Aerial imagery from satellites' },
  { id: 'hybrid', name: 'Hybrid', description: 'Satellite imagery with street labels' },
  { id: 'terrain', name: 'Terrain', description: 'Topographic map showing elevation' },
];

export default function MapLayerSettingsPage() {
  const router = useRouter();
  const { themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';
  
  const [selectedLayer, setSelectedLayer] = useState('standard');

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('tavvy-map-layer');
    if (saved) {
      setSelectedLayer(saved);
    }
  }, []);

  const handleLayerChange = (layerId: string) => {
    setSelectedLayer(layerId);
    localStorage.setItem('tavvy-map-layer', layerId);
  };

  return (
    <>
      <Head>
        <title>Map Layer | TavvY Settings</title>
        <meta name="description" content="Change your default map layer" />
      </Head>

      <AppLayout>
        <div className="map-settings">
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={() => router.back()}>
              <FiArrowLeft size={24} />
            </button>
            <h1>Default Map Layer</h1>
            <div style={{ width: 24 }} />
          </header>

          <div className="content">
            <p className="description">
              Choose the default map style when viewing locations.
            </p>

            <div className="layers-list">
              {mapLayers.map((layer) => (
                <button
                  key={layer.id}
                  className={`layer-item ${selectedLayer === layer.id ? 'selected' : ''}`}
                  onClick={() => handleLayerChange(layer.id)}
                >
                  <div className="layer-info">
                    <span className="layer-name">{layer.name}</span>
                    <span className="layer-description">{layer.description}</span>
                  </div>
                  {selectedLayer === layer.id && (
                    <FiCheck size={20} className="check-icon" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <style jsx>{`
            .map-settings {
              min-height: 100vh;
              background: ${isDark ? '#0a0a0f' : '#f5f5f7'};
              color: ${isDark ? '#ffffff' : '#1a1a2e'};
            }

            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              background: ${isDark ? '#0f1233' : '#ffffff'};
              border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
              position: sticky;
              top: 0;
              z-index: 100;
            }

            .header h1 {
              font-size: 18px;
              font-weight: 600;
              margin: 0;
            }

            .back-btn {
              background: none;
              border: none;
              color: inherit;
              cursor: pointer;
              padding: 8px;
              margin: -8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .content {
              padding: 20px;
              padding-bottom: 100px;
            }

            .description {
              font-size: 14px;
              color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
              margin-bottom: 24px;
              line-height: 1.5;
            }

            .layers-list {
              display: flex;
              flex-direction: column;
              gap: 2px;
              background: ${isDark ? '#1a1a2e' : '#ffffff'};
              border-radius: 16px;
              overflow: hidden;
            }

            .layer-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              background: transparent;
              border: none;
              color: inherit;
              cursor: pointer;
              width: 100%;
              text-align: left;
              transition: background 0.2s ease;
            }

            .layer-item:hover {
              background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
            }

            .layer-item.selected {
              background: ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'};
            }

            .layer-info {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .layer-name {
              font-size: 16px;
              font-weight: 500;
            }

            .layer-description {
              font-size: 13px;
              color: ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
            }

            .check-icon {
              color: #3b82f6;
              flex-shrink: 0;
            }

            .layer-item:not(:last-child) {
              border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
            }
          `}</style>
        </div>
      </AppLayout>
    </>
  );
}
