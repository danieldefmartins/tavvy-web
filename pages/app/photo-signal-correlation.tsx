import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchReviewsWithPhotos } from '../../api/reviews'; // Assuming an API endpoint exists
import { ReviewCard } from '../../components/ReviewCard'; // Assuming a component exists
import { SignalFilter } from '../../components/SignalFilter'; // Assuming a component exists

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
  },
  header: {
    color: '#17013A',
    fontSize: '24px',
    marginBottom: '20px',
  },
  filterContainer: {
    marginBottom: '20px',
  },
  reviewList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
  },
};

const PhotoSignalCorrelation = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const loadReviews = async () => {
      const data = await fetchReviewsWithPhotos();
      setReviews(data);
      setFilteredReviews(data);
    };
    loadReviews();
  }, []);

  const handleSignalChange = (signal) => {
    setSelectedSignal(signal);
    if (signal) {
      setFilteredReviews(reviews.filter(review => review.signals.includes(signal)));
    } else {
      setFilteredReviews(reviews);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Photo + Signal Correlation</h1>
      <div style={styles.filterContainer}>
        <SignalFilter selectedSignal={selectedSignal} onSignalChange={handleSignalChange} />
      </div>
      <div style={styles.reviewList}>
        {filteredReviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};

export default PhotoSignalCorrelation;
