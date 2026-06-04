import { NextApiRequest, NextApiResponse } from 'next';

// Mock data or actual database query
const reviewsWithPhotos = [
  // Example review objects
  { id: 1, signals: ['Fresh Pasta'], photos: ['url1', 'url2'], content: 'Great pasta!' },
  // More reviews
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(reviewsWithPhotos);
}
