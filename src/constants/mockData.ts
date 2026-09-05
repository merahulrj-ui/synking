import { UserProfile, Venue, DateBooking } from '../types';

export const MOCK_PROFILES: UserProfile[] = [
  {
    id: 'user_ananya_01',
    name: 'Ananya Sharma',
    age: 23,
    gender: 'female',
    occupation: 'UI/UX Designer',
    location: { city: 'Roorkee', coordinates: [29.8710, 77.8930] },
    distance: '1 km away',
    bio: 'Coffee lover, aesthetic cafe hopper & bookworm ✨ Looking for genuine conversations and good vibes!',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
    ],
    interests: ['Coffee ☕', 'Design 🎨', 'Travel ✈️', 'Photography 📸', 'Books 📚'],
    compatibility: 96,
    isVerified: true,
    isVip: true,
  },
  {
    id: 'user_rohan_02',
    name: 'Rohan Verma',
    age: 25,
    gender: 'male',
    occupation: 'Software Engineer',
    location: { city: 'Roorkee', coordinates: [29.8820, 77.9050] },
    distance: '3 km away',
    bio: 'Techie by day, guitarist by night 🎸 Let’s grab specialty coffee and talk about music, sci-fi, or deep thoughts.',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
    ],
    interests: ['Guitar 🎸', 'Coding 💻', 'Fitness 🏋️', 'Gaming 🎮', 'Rock Music 🎧'],
    compatibility: 92,
    isVerified: true,
    isVip: false,
  }
];

export const MOCK_VENUES: Venue[] = [
  {
    id: 'venue_1',
    name: 'Blue Tokai Roasters & Bakehouse',
    category: 'Artisan Cafe',
    rating: 4.9,
    reviewsCount: 340,
    priceForTwo: '₹650 for two',
    address: 'Connaught Place, Inner Circle',
    distance: '1.2 km',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    isVerifiedSafe: true,
    perks: 'Free Artisan Dessert with SYNKING Booking',
    tag: 'Top First Date Pick 🔥'
  },
  {
    id: 'venue_2',
    name: 'Smaaash Neon Bowling & Arcade',
    category: 'Activity Date',
    rating: 4.8,
    reviewsCount: 520,
    priceForTwo: '₹1,200 for two',
    address: 'Cyber Hub, Sector 24',
    distance: '2.8 km',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80',
    isVerifiedSafe: true,
    perks: '2 Bowling Games + Loaded Nachos Combo',
    tag: 'High Energy & Fun 🎳'
  },
  {
    id: 'venue_3',
    name: 'Diggin Garden Cafe & Ristorante',
    category: 'Romantic Diners',
    rating: 4.9,
    reviewsCount: 890,
    priceForTwo: '₹1,400 for two',
    address: 'Anand Lok, Opposite Gargi',
    distance: '3.5 km',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    isVerifiedSafe: true,
    perks: 'Reserved Fairy-Light Table + Mocktails',
    tag: 'Most Romantic Vibe ✨'
  },
  {
    id: 'venue_4',
    name: 'The Piano Man Jazz Club & Dine',
    category: 'Jazz & Lounges',
    rating: 4.7,
    reviewsCount: 410,
    priceForTwo: '₹1,800 for two',
    address: 'Safdarjung Enclave',
    distance: '4.1 km',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    isVerifiedSafe: true,
    perks: 'Priority Entry + Cocktails 20% Off',
    tag: 'Live Soul Music 🎷'
  },
  {
    id: 'venue_5',
    name: 'Claytopia Pottery & Coffee',
    category: 'Creative Workshops',
    rating: 4.8,
    reviewsCount: 215,
    priceForTwo: '₹1,100 for two',
    address: 'Hauz Khas Village',
    distance: '2.1 km',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    isVerifiedSafe: true,
    perks: 'Couple Pottery Kit & Aprons Included',
    tag: 'Break the Ice 🎨'
  }
];
