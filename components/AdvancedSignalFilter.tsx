import React, { useState } from 'react';

type Signal = {
  name: string;
  mustHave: boolean;
};

type AdvancedSignalFilterProps = {
  signals: Signal[];
  onApplyFilters: (selectedSignals: Signal[]) => void;
};

const AdvancedSignalFilter: React.FC<AdvancedSignalFilterProps> = ({ signals, onApplyFilters }) => {
  const [selectedSignals, setSelectedSignals] = useState<Signal[]>(signals);

  const toggleMustHave = (index: number) => {
    const updatedSignals = [...selectedSignals];
    updatedSignals[index].mustHave = !updatedSignals[index].mustHave;
    setSelectedSignals(updatedSignals);
  };

  const handleApplyFilters = () => {
    onApplyFilters(selectedSignals);
  };

  const styles = {
    container: {
      padding: '16px',
      backgroundColor: '#17013A',
      color: '#FFFFFF',
    },
    signalItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px',
      borderBottom: '1px solid #8A05BE',
    },
    toggleButton: {
      backgroundColor: '#00C2CB',
      border: 'none',
      color: '#FFFFFF',
      padding: '8px',
      cursor: 'pointer',
    },
    applyButton: {
      backgroundColor: '#F5A623',
      border: 'none',
      color: '#FFFFFF',
      padding: '12px',
      cursor: 'pointer',
      marginTop: '16px',
    },
  };

  return (
    <div style={styles.container}>
      {selectedSignals.map((signal, index) => (
        <div key={signal.name} style={styles.signalItem}>
          <span>{signal.name}</span>
          <button style={styles.toggleButton} onClick={() => toggleMustHave(index)}>
            {signal.mustHave ? 'Must Have' : 'Nice to Have'}
          </button>
        </div>
      ))}
      <button style={styles.applyButton} onClick={handleApplyFilters}>
        Apply Filters
      </button>
    </div>
  );
};

export default AdvancedSignalFilter;
