import React, { useState } from 'react';

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#F9F9F9',
    minHeight: '100vh',
  },
  header: {
    fontSize: '24px',
    color: '#17013A',
    marginBottom: '20px',
  },
  collection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  toggleButton: {
    backgroundColor: '#8A05BE',
    color: '#FFFFFF',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

const Collections = () => {
  const [collections, setCollections] = useState([
    { name: 'First Dates', isPublic: true },
    { name: 'Late Night Bites', isPublic: false },
    { name: 'Expense Account Dinners', isPublic: true },
  ]);

  const togglePrivacy = (index: number) => {
    const updatedCollections = [...collections];
    updatedCollections[index].isPublic = !updatedCollections[index].isPublic;
    setCollections(updatedCollections);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>My Collections</h1>
      {collections.map((collection, index) => (
        <div key={index} style={styles.collection}>
          <h2>{collection.name}</h2>
          <button
            style={styles.toggleButton}
            onClick={() => togglePrivacy(index)}
          >
            {collection.isPublic ? 'Make Private' : 'Make Public'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default Collections;
