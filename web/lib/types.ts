export interface Profile {
  id: string;
  name: string;
  age: number;
  bio?: string;
  city?: string;
  distanceKm?: number;
  photoUrl?: string;
  photos?: string[];
  interests?: string[];
  isVerified?: boolean;
  online?: boolean;
}

export interface DateVenue {
  id: string;
  name: string;
  category: string;
  location: string;
  distance: string;
  rating: number;
  perk: string;
  image: string;
  safetyScore: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  phone: string;
  city?: string;
  token?: string;
}
