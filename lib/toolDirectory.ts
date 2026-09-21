/** Directory copy and grouping shared by web and native. */
export const TOOL_GROUPS = [
  { id: 'discover', title: 'Find your next stop', description: 'Good food, new places and a little adventure.' },
  { id: 'connect', title: 'People who can help', description: 'Find local expertise and keep the conversation going.' },
  { id: 'personal', title: 'Your everyday essentials', description: 'Keep useful things close and make Tavvy yours.' },
];
export const TOOL_DETAILS: Record<string, { name: string; description: string; group: string }> = {
  cruises: { name: 'Cruises', description: 'Explore ocean, river and expedition ships.', group: 'discover' },
  'food-menu': { name: 'Food Menu', description: 'Find a dish you’re craving nearby.', group: 'discover' },
  universes: { name: 'Universes', description: 'Explore parks, airports and places within them.', group: 'discover' },
  onthego: { name: 'On The Go', description: 'Find food trucks and mobile businesses.', group: 'discover' },
  rides: { name: 'Rides', description: 'Plan your next theme park adventure.', group: 'discover' },
  'rv-camping': { name: 'RV & Camping', description: 'Find somewhere to park, camp and unwind.', group: 'discover' },
  cities: { name: 'Cities', description: 'Get to know a new city.', group: 'discover' },
  happening: { name: 'Happening Now', description: 'See local events and what’s coming up.', group: 'discover' },
  experiences: { name: 'Experiences', description: 'Explore a path of places or create your own.', group: 'discover' },
  atlas: { name: 'Atlas', description: 'Browse guides and stories about places.', group: 'discover' },
  pros: { name: 'Pros', description: 'Find local professionals for your next project.', group: 'connect' },
  realtors: { name: 'Realtors', description: 'Connect with real estate professionals.', group: 'connect' },
  messages: { name: 'Messages', description: 'Pick up your conversations.', group: 'connect' },
  ecard: { name: 'eCard', description: 'Create a digital card that introduces you.', group: 'connect' },
  saved: { name: 'Saved', description: 'Return to places you want to remember.', group: 'personal' },
  wallet: { name: 'Wallet', description: 'Keep business cards and contacts together.', group: 'personal' },
  create: { name: 'Create', description: 'Add a place, business or something new.', group: 'personal' },
  account: { name: 'Account', description: 'Manage your profile and personal details.', group: 'personal' },
  settings: { name: 'Settings', description: 'Set up Tavvy the way you like it.', group: 'personal' },
};
export const toolKey = (id: string) => id === 'digital-card' ? 'ecard' : id === 'on-the-go' ? 'onthego' : id;
export const toolMatches = (id: string, query: string, translatedName = '') => {
  const detail = TOOL_DETAILS[toolKey(id)];
  return [detail?.name, detail?.description, translatedName].some(text => text?.toLowerCase().includes(query.trim().toLowerCase()));
};
