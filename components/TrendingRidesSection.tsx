import React from 'react';

const TrendingRidesSection = () => {
  const rides = [
    {
      id: 1,
      name: 'Roller Coaster',
      image: '/images/rides/roller-coaster.jpg',
      thrillLevel: 'High',
      waitTime: '15 mins',
      signals: [4, 5, 3, 4],
    },
    // Add more ride objects here
  ];

  const styles = {
    container: {
      backgroundColor: '#17013A',
      borderRadius: '12px',
      padding: '16px',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      marginTop: '24px',
    },
    card: {
      display: 'inline-block',
      backgroundColor: '#fff',
      borderRadius: '12px',
      marginRight: '16px',
      width: '200px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    },
    image: {
      width: '100%',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
    },
    content: {
      padding: '8px',
    },
    rideName: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#8A05BE',
    },
    metadata: {
      fontSize: '14px',
      color: '#333',
    },
    signals: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '8px',
    },
    signal: {
      width: '20px',
      height: '20px',
      backgroundColor: '#00C2CB',
      borderRadius: '50%',
      display: 'inline-block',
    },
  };

  return (
    <div style={styles.container}>
      {rides.map((ride) => (
        <div key={ride.id} style={styles.card}>
          <img src={ride.image} alt={ride.name} style={styles.image} />
          <div style={styles.content}>
            <div style={styles.rideName}>{ride.name}</div>
            <div style={styles.metadata}>
              Thrill Level: {ride.thrillLevel} <br />
              Wait Time: {ride.waitTime}
            </div>
            <div style={styles.signals}>
              {ride.signals.map((signal, index) => (
                <div key={index} style={{ ...styles.signal, opacity: signal / 5 }} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrendingRidesSection;
