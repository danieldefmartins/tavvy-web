import React from 'react';
import { Line } from 'react-chartjs-2';
import { useRouter } from 'next/router';

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
  chartContainer: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
};

const data = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'Engagement Over Time',
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: false,
      backgroundColor: '#8A05BE',
      borderColor: '#8A05BE',
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const AnalyticsDashboard = () => {
  const router = useRouter();

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Advanced Analytics Dashboard</h1>
      <div style={styles.chartContainer}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
