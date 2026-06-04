import React from 'react';

interface RestaurantCardProps {
  images: string[];
  signals: { name: string; count: number }[];
  onSave: () => void;
  onBookmark: () => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ images, signals, onSave, onBookmark }) => {
  const styles = {
    card: {
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      marginBottom: '16px',
      backgroundColor: '#fff',
    },
    imageContainer: {
      position: 'relative' as 'relative',
      width: '100%',
      height: '200px',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as 'cover',
    },
    content: {
      padding: '16px',
    },
    signals: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '8px',
    },
    signal: {
      color: '#8A05BE',
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    button: {
      backgroundColor: '#00C2CB',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 12px',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.imageContainer}>
        <img src={images[0]} alt="Restaurant" style={styles.image} />
      </div>
      <div style={styles.content}>
        <div style={styles.signals}>
          {signals.slice(0, 3).map((signal, index) => (
            <span key={index} style={styles.signal}>
              {signal.name}: {signal.count}
            </span>
          ))}
        </div>
        <div style={styles.actions}>
          <button style={styles.button} onClick={onSave}>Save</button>
          <button style={styles.button} onClick={onBookmark}>Bookmark</button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
