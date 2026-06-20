import React from 'react';

const styles = {
  carouselContainer: {
    display: 'flex',
    overflowX: 'auto',
    padding: '20px 0',
    backgroundColor: '#17013A',
  },
  rideCard: {
    flex: '0 0 auto',
    width: '250px',
    marginRight: '20px',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
  },
  rideImage: {
    width: '100%',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
  },
  rideContent: {
    padding: '10px',
  },
  rideName: {
    color: '#00C2CB',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  rideDescription: {
    color: '#333',
    fontSize: '14px',
    marginTop: '5px',
  },
  signalIndicators: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
  signal: {
    fontSize: '12px',
    color: '#888',
  },
};

const TrendingRidesCarousel = () => {
  const rides = [
    {
      name: 'Thunderbolt',
      description: 'A thrilling roller coaster with sharp turns and steep drops.',
      image: '/images/thunderbolt.jpg',
      thrillLevel: 'High',
      waitTime: '30 mins',
    },
    // Add more ride objects as needed
  ];

  return (
    <div style={styles.carouselContainer}>
      {rides.map((ride, index) => (
        <div key={index} style={styles.rideCard}>
          <img src={ride.image} alt={ride.name} style={styles.rideImage} />
          <div style={styles.rideContent}>
            <div style={styles.rideName}>{ride.name}</div>
            <div style={styles.rideDescription}>{ride.description}</div>
            <div style={styles.signalIndicators}>
              <div style={styles.signal}>Thrill: {ride.thrillLevel}</div>
              <div style={styles.signal}>Wait: {ride.waitTime}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrendingRidesCarousel;
