/**
 * Business categories offered when adding a place (web + mobile share this list).
 * Grouped for display; `BUSINESS_CATEGORIES` is the flat searchable list. Add new entries here, never in a screen.
 * Anything that can get a review is a place, so public restrooms, rides and lookouts belong here too.
 */
export const BUSINESS_CATEGORY_GROUPS: { group: string; items: string[] }[] = [
  { group: 'Food & Drink', items: ['Restaurant', 'Cafe', 'Coffee Shop', 'Bar', 'Pub', 'Brewery', 'Winery', 'Bakery', 'Ice Cream', 'Fast Food', 'Food Truck', 'Juice Bar', 'Deli', 'Pizza', 'Sushi', 'BBQ', 'Seafood', 'Mexican Restaurant', 'Italian Restaurant', 'Chinese Restaurant', 'Japanese Restaurant', 'Thai Restaurant', 'Indian Restaurant', 'Brazilian Restaurant', 'Mediterranean Restaurant', 'Greek Restaurant', 'Korean Restaurant', 'Vietnamese Restaurant', 'Caribbean Restaurant', 'Steakhouse', 'Vegan Restaurant', 'Diner', 'Buffet', 'Dessert Shop', 'Donut Shop', 'Bubble Tea', 'Smoothie Bar', 'Wine Shop', 'Liquor Store', 'Distillery', 'Cidery', 'Tea Room', 'Caterer'] },
  { group: 'Grocery & Market', items: ['Grocery', 'Supermarket', 'Convenience Store', 'Farmers Market', 'Butcher', 'Fish Market'] },
  { group: 'Retail & Shopping', items: ['Retail', 'Shopping Mall', 'Clothing Store', 'Shoe Store', 'Jewelry', 'Electronics', 'Bookstore', 'Gift Shop', 'Thrift Store', 'Toy Store', 'Sporting Goods', 'Music Store', 'Art Supply', 'Craft Store', 'Florist', 'Antiques', 'Pharmacy Store', 'Dollar Store', 'Department Store', 'Outlet', 'Pawn Shop', 'Vape Shop', 'Smoke Shop', 'Cannabis Dispensary', 'Bike Shop', 'Furniture Outlet', 'Mattress Store', 'Party Supply', 'Baby Store', 'Optical Store', 'Cell Phone Store', 'Computer Store', 'Game Store', 'Comic Store', 'Record Store', 'Fabric Store', 'Garden Center'] },
  { group: 'Health & Medical', items: ['Health & Wellness', 'Doctor', 'Dentist', 'Hospital', 'Urgent Care', 'Pharmacy', 'Chiropractor', 'Optometrist', 'Physical Therapy', 'Mental Health', 'Dermatologist', 'Acupuncture', 'Nutritionist', 'Pediatrician', 'Optician', 'Senior Care', 'Home Health Care', 'Nursing Home', 'Assisted Living', 'Lab & Diagnostics', 'Medical Spa', 'Rehab Center', 'Blood Donation'] },
  { group: 'Beauty', items: ['Beauty & Spa', 'Hair Salon', 'Barber', 'Nail Salon', 'Spa', 'Tattoo', 'Piercing', 'Lash & Brow', 'Skincare', 'Massage', 'Med Spa', 'Waxing', 'Tanning Salon', 'Cosmetics Store', 'Eyebrow Threading'] },
  { group: 'Fitness', items: ['Fitness', 'Gym', 'Yoga Studio', 'Pilates', 'CrossFit', 'Martial Arts', 'Dance Studio', 'Swimming Pool', 'Rock Climbing', 'Boxing', 'Personal Trainer', 'Cycling Studio', 'Barre', 'Climbing Gym', 'Skating Rink', 'Golf Range', 'Batting Cages', 'Bowling Alley', 'Skatepark'] },
  { group: 'Entertainment', items: ['Entertainment', 'Movie Theater', 'Bowling', 'Arcade', 'Escape Room', 'Mini Golf', 'Trampoline Park', 'Go Kart', 'Laser Tag', 'Water Park', 'Amusement Park', 'Zoo', 'Aquarium', 'Theme Park'] },
  { group: 'Arts & Culture', items: ['Arts & Culture', 'Museum', 'Art Gallery', 'Theater', 'Concert Venue', 'Library', 'Cultural Center', 'Historic Site'] },
  { group: 'Nightlife', items: ['Nightlife', 'Night Club', 'Lounge', 'Comedy Club', 'Karaoke', 'Wine Bar', 'Sports Bar', 'Hookah Lounge', 'Cocktail Bar', 'Dive Bar', 'Beer Garden', 'Dance Club', 'Live Music'] },
  { group: 'Services', items: ['Services', 'Bank', 'ATM', 'Post Office', 'Laundromat', 'Dry Cleaner', 'Tailor', 'Locksmith', 'Print Shop', 'Shipping', 'Storage', 'Cleaning Service'] },
  { group: 'Automotive', items: ['Automotive', 'Gas Station', 'Car Wash', 'Auto Repair', 'Tire Shop', 'Car Dealership', 'Parking', 'Oil Change', 'Auto Parts', 'Car Rental', 'Body Shop', 'Towing', 'EV Charging Station', 'Motorcycle Dealer', 'Motorcycle Repair', 'Boat Dealer', 'Boat Repair', 'RV Dealer', 'Truck Stop', 'Auto Detailing', 'Inspection Station'] },
  { group: 'Home & Garden', items: ['Home & Garden', 'Hardware Store', 'Nursery', 'Furniture Store', 'Home Decor', 'Appliance Store', 'Plumbing', 'Electrical', 'Landscaping', 'Pool Service', 'Pest Control', 'Tree Service', 'Lawn Care', 'Garage Door', 'Septic Service', 'Pool Builder', 'Irrigation', 'Junk Removal', 'Moving Company', 'Home Security', 'Interior Design', 'Carpet Cleaning', 'Pressure Washing', 'Window Cleaning', 'Gutter Cleaning', 'Appliance Repair'] },
  { group: 'Professional', items: ['Professional', 'Law Office', 'Accountant', 'Real Estate', 'Insurance', 'Consulting', 'Financial Advisor', 'Architect', 'Marketing Agency', 'IT Services', 'Coworking Space', 'Web Design', 'Tax Preparer', 'Notary', 'Translator', 'Recruiter', 'Security Company', 'Cleaning Company', 'Call Center', 'Nonprofit', 'Charity'] },
  { group: 'Education', items: ['Education', 'School', 'University', 'Tutoring', 'Music Lessons', 'Art Classes', 'Driving School', 'Language School', 'Daycare', 'Preschool', 'Cooking School', 'Coding Bootcamp', 'Test Prep', 'Trade School', 'Community College', 'Library Branch'] },
  { group: 'Pets', items: ['Pets', 'Veterinarian', 'Pet Store', 'Dog Park', 'Pet Grooming', 'Boarding', 'Dog Training', 'Pet Adoption', 'Animal Shelter', 'Pet Sitting', 'Dog Walker', 'Aquarium Store', 'Horse Stable'] },
  { group: 'Religious', items: ['Religious', 'Church', 'Mosque', 'Synagogue', 'Temple', 'Meditation Center', 'Cathedral', 'Chapel', 'Shrine', 'Retreat Center', 'Cemetery'] },
  { group: 'Outdoors & Recreation', items: ['Outdoors', 'Park', 'Playground', 'Beach', 'Trail', 'Campground', 'Marina', 'Golf Course', 'Skate Park', 'Sports Field', 'Tennis Court', 'Basketball Court'] },
  { group: 'Lodging', items: ['Hotel', 'Motel', 'Hostel', 'Vacation Rental', 'Resort', 'Bed & Breakfast', 'Inn', 'Lodge', 'Cabin Rental', 'Glamping', 'Boutique Hotel', 'Extended Stay', 'Timeshare', 'Guest House'] },
  { group: 'Transportation', items: ['Transportation', 'Bus Station', 'Train Station', 'Airport', 'Ferry', 'Bike Rental', 'Scooter Rental', 'Taxi Stand', 'Subway Station', 'Light Rail', 'Bus Stop', 'Parking Garage', 'Parking Lot', 'EV Charging', 'Car Charging', 'Toll Plaza', 'Heliport', 'Seaplane Base'] },
  { group: 'Government', items: ['Government', 'City Hall', 'DMV', 'Courthouse', 'Fire Station', 'Police Station', 'Community Center', 'Recycling Center', 'Public Library', 'Embassy', 'Consulate', 'Social Services', 'Passport Office', 'Veterans Office', 'Town Hall', 'Public Works'] },
  { group: 'Construction', items: ['Construction Company', 'General Contractor', 'Home Builder', 'Remodeling', 'Kitchen & Bath Remodel', 'Roofing', 'HVAC', 'Electrician', 'Plumber', 'Painter', 'Carpentry', 'Framing', 'Drywall', 'Flooring', 'Tile', 'Masonry', 'Concrete', 'Paving & Asphalt', 'Excavation', 'Demolition', 'Steel & Ironwork', 'Welding', 'Insulation', 'Siding', 'Windows & Doors', 'Fence Company', 'Deck & Patio', 'Cabinetry', 'Countertops', 'Glass & Mirror', 'Waterproofing', 'Solar Installation', 'Home Inspection', 'Handyman', 'Construction Supplies', 'Equipment Rental'] },
  { group: 'Events & Weddings', items: ['Event Venue', 'Wedding Venue', 'Banquet Hall', 'Event Planner', 'Wedding Planner', 'Photographer', 'Videographer', 'DJ', 'Party Rentals'] },
  { group: 'Attractions', items: ['Attraction', 'Landmark', 'Scenic Viewpoint', 'Observation Deck', 'Tour Operator', 'Boat Tour', 'Ride', 'Roller Coaster', 'Carnival', 'Fair', 'Festival Grounds', 'Casino', 'Racetrack', 'Stadium', 'Arena'] },
  { group: 'Travel', items: ['Travel Agency', 'Cruise Terminal', 'RV Park', 'Rest Area', 'Visitor Center', 'Tourist Information', 'Luggage Storage'] },
  { group: 'Public & Civic', items: ['Public Restroom', 'Water Fountain', 'Public Bench', 'Picnic Area', 'Dog Waste Station', 'Bike Rack', 'Charging Spot', 'Wi-Fi Spot', 'Lookout', 'Boat Launch', 'Fishing Spot', 'Swimming Hole', 'Public Pool', 'Ice Rink', 'Ski Area'] },
  { group: 'Kids & Family', items: ['Indoor Playground', 'Kids Activities', 'Birthday Party Venue', 'Toy Library', 'Family Entertainment Center', 'Summer Camp', 'Childcare'] },
  { group: 'Other', items: ['Other'] },
];

export const BUSINESS_CATEGORIES: string[] = Array.from(new Set(BUSINESS_CATEGORY_GROUPS.flatMap(g => g.items)));

/** Case-insensitive search over the flat list; an empty query returns everything in group order. */
export function searchBusinessCategories(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return BUSINESS_CATEGORIES;
  const starts = BUSINESS_CATEGORIES.filter(c => c.toLowerCase().startsWith(q));
  const contains = BUSINESS_CATEGORIES.filter(c => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q));
  return [...starts, ...contains];
}
