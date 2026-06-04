import React, { useState } from 'react';

const SignalSearch = () => {
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);

  const handleSignalToggle = (signal: string) => {
    setSelectedSignals(prev =>
      prev.includes(signal)
        ? prev.filter(s => s !== signal)
        : [...prev, signal]
    );
  };

  const popularSignalCombos = [
    ["Fresh Pasta", "Cozy & Intimate"],
    ["Vegan Options", "Family Friendly"],
    ["Live Music", "Outdoor Seating"]
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Signal-Based Search</h1>
      <div style={styles.popularCombos}>
        <h2 style={styles.subtitle}>Popular Signal Combos</h2>
        {popularSignalCombos.map((combo, index) => (
          <div key={index} style={styles.combo}>
            {combo.join(' + ')}
          </div>
        ))}
      </div>
      <div style={styles.signals}>
        <h2 style={styles.subtitle}>Select Signals</h2>
        {["Fresh Pasta", "Cozy & Intimate", "Vegan Options", "Family Friendly", "Live Music", "Outdoor Seating"].map(signal => (
          <button
            key={signal}
            style={{
              ...styles.signalButton,
              backgroundColor: selectedSignals.includes(signal) ? '#8A05BE' : '#F5A623'
            }}
            onClick={() => handleSignalToggle(signal)}
          >
            {signal}
          </button>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#17013A',
    color: '#FFFFFF',
    minHeight: '100vh'
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px'
  },
  popularCombos: {
    marginBottom: '20px'
  },
  subtitle: {
    fontSize: '18px',
    marginBottom: '10px'
  },
  combo: {
    marginBottom: '5px'
  },
  signals: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  signalButton: {
    margin: '5px',
    padding: '10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    color: '#FFFFFF'
  }
};

export default SignalSearch;
