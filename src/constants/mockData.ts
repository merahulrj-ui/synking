import { UserProfile, Venue, DateBooking } from '../types';

export const MOCK_PROFILES: UserProfile[] = [
  {
    id: 'user_1',
    name: 'Ananya Sharma',
    age: 23,
    gender: 'female',
    occupation: 'Architect & Interior Stylist',
    location: 'South Delhi',
    distance: '1.8 km away',
    bio: 'Architecture student & specialty coffee nerd ☕ Let’s skip boring dry texting and play neon bowling or explore cozy art cafes!',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80'
    ],
    interests: ['Specialty Coffee', 'Architecture', 'Indie Music', 'Board Games'],
    compatibility: 96,
    isVerified: true,
    isVip: true
  },
  {
    id: 'user_2',
    name: 'Kabir Malhotra',
    age: 26,
    gender: 'male',
    occupation: 'Product Founder',
    location: 'Gurugram',
    distance: '3.4 km away',
    bio: 'Tech founder by day, amateur jazz guitarist by night 🎸 Looking for genuine chemistry over iced americanos & live soul music.',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80'
    ],
    interests: ['Live Jazz', 'Startups', 'Fitness', 'Cinema', 'Espresso'],
    compatibility: 92,
    isVerified: true,
    isVip: true
  },
  {
    id: 'user_3',
    name: 'Tanya Kapoor',
    age: 24,
    gender: 'female',
    occupation: 'Food & Travel Photographer',
    location: 'Connaught Place',
    distance: '2.1 km away',
    bio: 'Photographer with a massive weakness for sourdough pizza 🍕 Looking for someone who can match my high energy and sweet tooth!',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80'
    ],
    interests: ['Photography', 'Sourdough', 'Pottery', 'Dogs', 'Road Trips'],
    compatibility: 95,
    isVerified: true,
    isVip: false
  },
  {
    id: 'user_4',
    name: 'Advait Roy',
    age: 25,
    gender: 'male',
    occupation: 'Strategy Consultant',
    location: 'Vasant Kunj',
    distance: '4.2 km away',
    bio: 'Strategy consultant, weekend hiker and competitive pickleball player. Big believer in 30-minute test coffee dates before big dinners ✨',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80'
    ],
    interests: ['Hiking', 'Pickleball', 'Podcasts', 'Books', 'Espresso'],
    compatibility: 89,
    isVerified: true,
    isVip: true
  },
  {
    id: 'user_5',
    name: 'Meera Sen',
    age: 22,
    gender: 'female',
    occupation: 'Fashion Writer',
    location: 'Hauz Khas Village',
    distance: '1.2 km away',
    bio: 'Fashion journalism & vinyl records collector. Looking for someone down for museum walks and french bakeries.',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80'
    ],
    interests: ['Fashion', 'Vinyl Records', 'French Bakery', 'Art', 'Museums'],
    compatibility: 94,
    isVerified: true,
    isVip: false
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
    perks: 'Free Artisan Dessert with SYNKON Booking',
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
