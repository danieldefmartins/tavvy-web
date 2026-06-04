import React, { useState } from 'react';

const PersonalSignalPreferences = () => {
  const [signals, setSignals] = useState({
    freshPasta: false,
    quietAmbiance: false,
    dogFriendly: false,
  });

  const handleSignalChange = (signal: string) => {
    setSignals((prevSignals) => ({
      ...prevSignals,
      [signal]: !prevSignals[signal],
    }));
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#F5F5F5',
    },
    title: {
      fontSize: '24px',
      color: '#17013A',
      marginBottom: '20px',
    },
    signalOption: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
    },
    checkbox: {
      marginRight: '10px',
    },
    label: {
      fontSize: '18px',
      color: '#8A05BE',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Personal Signal Preferences</h1>
      <div style={styles.signalOption}>
        <input
          type="checkbox"
          checked={signals.freshPasta}
          onChange={() => handleSignalChange('freshPasta')}
          style={styles.checkbox}
        />
        <label style={styles.label}>Fresh Pasta</label>
      </div>
      <div style={styles.signalOption}>
        <input
          type="checkbox"
          checked={signals.quietAmbiance}
          onChange={() => handleSignalChange('quietAmbiance')}
          style={styles.checkbox}
        />
        <label style={styles.label}>Quiet Ambiance</label>
      </div>
      <div style={styles.signalOption}>
        <input
          type="checkbox"
          checked={signals.dogFriendly}
          onChange={() => handleSignalChange('dogFriendly')}
          style={styles.checkbox}
        />
        <label style={styles.label}>Dog-Friendly</label>
      </div>
    </div>
  );
};

export default PersonalSignalPreferences;
