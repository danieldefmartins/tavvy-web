import React from 'react';

const styles = {
  container: {
    padding: '16px',
    border: `1px solid #E0E0E0`,
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#17013A',
    marginBottom: '8px',
  },
  item: {
    padding: '8px 0',
    borderBottom: '1px solid #E0E0E0',
  },
  itemName: {
    fontSize: '16px',
    color: '#8A05BE',
  },
  itemQuality: {
    fontSize: '14px',
    color: '#00C2CB',
  },
};

interface MenuInsight {
  name: string;
  quality: string;
}

const MenuInsights = ({ insights }: { insights: MenuInsight[] }) => {
  return (
    <div style={styles.container}>
      <div style={styles.title}>Recommended Dishes</div>
      {insights.map((insight: MenuInsight, index: number) => (
        <div key={index} style={styles.item}>
          <div style={styles.itemName}>{insight.name}</div>
          <div style={styles.itemQuality}>{insight.quality}</div>
        </div>
      ))}
    </div>
  );
};

export default MenuInsights;
