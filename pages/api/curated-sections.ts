import { NextApiRequest, NextApiResponse } from 'next';

const curatedSections = [
  { title: 'Top-Rated Sites', description: 'Explore the best-rated places by our users.' },
  { title: 'Hidden Gems', description: 'Discover lesser-known spots that are worth a visit.' },
  { title: 'User-Recommended', description: 'Check out places recommended by our community.' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(curatedSections);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
