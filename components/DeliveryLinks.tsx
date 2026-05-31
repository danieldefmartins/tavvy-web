/**
 * DeliveryLinks — Smart Delivery Platform Links
 *
 * Shows DoorDash, UberEats, Grubhub search links for the restaurant.
 * Only renders if ordering_enabled is false (don't show competitors
 * if the place has Tavvy ordering).
 */

import React from 'react';

interface DeliveryLinksProps {
  restaurantName: string;
  address?: string;
  orderingEnabled?: boolean;
}

const PLATFORMS = [
  {
    name: 'DoorDash',
    color: '#FF3008',
    buildUrl: (name: string) =>
      `https://www.doordash.com/search/store/${encodeURIComponent(name)}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.071 8.409a6.09 6.09 0 0 0-5.396-3.228H.584A.589.589 0 0 0 .17 6.184L3.894 9.93a1.752 1.752 0 0 0 1.242.516h12.049a1.554 1.554 0 1 1 0 3.108H8.9a.589.589 0 0 0-.415 1.003l3.725 3.747a1.752 1.752 0 0 0 1.242.516h3.733a6.12 6.12 0 0 0 5.886-7.411z"/>
      </svg>
    ),
  },
  {
    name: 'Uber Eats',
    color: '#06C167',
    buildUrl: (name: string) =>
      `https://www.ubereats.com/search?q=${encodeURIComponent(name)}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 7.519a.75.75 0 0 1-.726.56H8.802a.75.75 0 0 1-.726-.56l-1.97-7.519a.75.75 0 0 1 .726-.94h10.336a.75.75 0 0 1 .726.94z"/>
      </svg>
    ),
  },
  {
    name: 'Grubhub',
    color: '#F63440',
    buildUrl: (name: string) =>
      `https://www.grubhub.com/search?orderMethod=delivery&query=${encodeURIComponent(name)}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8H9V7h6v2z"/>
      </svg>
    ),
  },
];

export default function DeliveryLinks({ restaurantName, address, orderingEnabled }: DeliveryLinksProps) {
  // Don't show if Tavvy ordering is enabled
  if (orderingEnabled) return null;

  const searchQuery = address ? `${restaurantName} ${address}` : restaurantName;

  return (
    <div className="delivery-links">
      <p className="delivery-links-label">Order delivery</p>
      <div className="delivery-links-row">
        {PLATFORMS.map((platform) => (
          <a
            key={platform.name}
            href={platform.buildUrl(searchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="delivery-link-btn"
            style={{ '--platform-color': platform.color } as React.CSSProperties}
          >
            <span className="delivery-link-icon">{platform.icon}</span>
            <span className="delivery-link-name">{platform.name}</span>
          </a>
        ))}
      </div>

      <style jsx>{`
        .delivery-links {
          padding: 16px 0;
        }
        .delivery-links-label {
          font-size: 13px;
          color: #888;
          margin: 0 0 10px;
          font-weight: 500;
        }
        .delivery-links-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .delivery-links-row::-webkit-scrollbar {
          display: none;
        }
        .delivery-link-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 20px;
          background: #1a1a1a;
          border: 1px solid #333;
          text-decoration: none;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .delivery-link-btn:hover {
          border-color: var(--platform-color);
          background: rgba(255, 255, 255, 0.05);
        }
        .delivery-link-icon {
          display: flex;
          align-items: center;
          color: var(--platform-color);
        }
        .delivery-link-name {
          color: #ddd;
        }
      `}</style>
    </div>
  );
}
