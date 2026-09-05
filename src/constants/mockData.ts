import { UserProfile, Venue, DateBooking } from '../types';

export const MOCK_PROFILES: UserProfile[] = [];

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
  },
  {
    id: 'venue_6',
    name: 'Cyber Hub Social & Lounge',
    category: 'Casual Foodie',
    rating: 4.9,
    reviewsCount: 1120,
    priceForTwo: '₹1,500 for two',
    address: 'DLF Cyber Hub, Gurugram',
    distance: '2.4 km',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=80',
    isVerifiedSafe: true,
    perks: '15% Off Total Bill + Priority Reserved Seating',
    tag: 'Buzzing Energy & Bites 🍹'
  },
  {
    id: 'venue_7',
    name: 'Perch Wine & Coffee Bar',
    category: 'Rooftop & Cocktails',
    rating: 4.9,
    reviewsCount: 680,
    priceForTwo: '₹2,000 for two',
    address: 'Khan Market, Mid Circle',
    distance: '3.1 km',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80',
    isVerifiedSafe: true,
    perks: 'Complimentary Glass of Sangria for Both',
    tag: 'Chic & Intimate Vibe 🍷'
  },
  {
    id: 'venue_8',
    name: 'Mystery Rooms Escape Lounge',
    category: 'Activity Date',
    rating: 4.8,
    reviewsCount: 390,
    priceForTwo: '₹1,600 for two',
    address: 'Connaught Place, M-Block',
    distance: '1.5 km',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    isVerifiedSafe: true,
    perks: 'Mission Duo Pass + Free Digital Polaroid Photo',
    tag: 'Thrilling Teamwork 🗝️'
  }
];

