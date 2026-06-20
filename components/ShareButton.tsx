import React from 'react';

const ShareButton: React.FC = () => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Digital Business Card',
        text: 'Check out my digital business card!',
        url: window.location.href,
      }).catch((error) => console.error('Error sharing', error));
    } else {
      // Fallback for browsers that do not support the Web Share API
      alert('Sharing is not supported in your browser. Please copy the URL manually.');
    }
  };

  const styles = {
    button: {
      backgroundColor: '#8A05BE',
      color: '#FFFFFF',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px',
    },
  };

  return (
    <button style={styles.button} onClick={handleShare}>
      Share My Card
    </button>
  );
};

export default ShareButton;
