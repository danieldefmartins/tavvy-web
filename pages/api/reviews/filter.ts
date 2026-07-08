import { NextApiRequest, NextApiResponse } from 'next';

const reviews = [
  // Example review data
  { id: 1, vehicleType: 'Van', tripPurpose: 'Weekend', content: 'Great trip!' },
  { id: 2, vehicleType: 'RV', tripPurpose: 'Full-time', content: 'Living the dream!' },
  // More reviews...
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { vehicleType, tripPurpose } = req.query;

  const filteredReviews = reviews.filter((review) => {
    return (
      (!vehicleType || review.vehicleType === vehicleType) &&
      (!tripPurpose || review.tripPurpose === tripPurpose)
    );
  });

  res.status(200).json(filteredReviews);
}
