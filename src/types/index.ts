export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'nonbinary' | 'other';
  occupation: string;
  location: string | { city: string; coordinates?: number[]; distance?: number };
  phoneNumber?: string;
  distance: string;
  bio: string;
  photo: string;
  photos: string[];
  interests: string[];
  compatibility: number;
  isVerified: boolean;
  isVip: boolean;

  // Rich Dating Profile Attributes (Tinder / Bumble style)
  company?: string;
  school?: string;
  height?: string;
  lookingFor?: string;
  zodiac?: string;
  drinking?: string;
  smoking?: string;
  workout?: string;
  dietary?: string;
  pets?: string;
  hometown?: string;
  languages?: string[];
  prompts?: { question: string; answer: string }[];
  completionPercentage?: number;
}

export interface SynkRequest {
  id: string;
  fromUser: UserProfile;
  toUserId: string;
  toUserName?: string;
  type: 'like' | 'supersynk';
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

export interface EncryptedChatMessageRecord {
  id: string;
  senderId: string;
  receiverId: string;
  cipherText: string;
  isEncrypted: boolean;
  type: 'text' | 'date_invite' | 'voice' | 'call' | 'system';
  timestamp: string;
}

export interface Venue {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount: number;
  priceForTwo: string;
  address: string;
  distance: string;
  image: string;
  isVerifiedSafe: boolean;
  perks: string;
  tag: string;
}

export interface DateBooking {
  id: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  userPhoto: string;
  venue: Venue;
  dateTime: string;
  packageName: string;
  splitType: 'split_50_50' | 'i_treat' | 'they_treat';
  status: 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  qrCode: string;
}

export interface CallSession {
  id: string;
  callerId: string;
  receiverId: string;
  callerName: string;
  callerPhoto: string;
  type: 'audio' | 'video';
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed';
  durationSeconds: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isVideoEnabled: boolean;
  isFrontCamera?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  type: 'text' | 'date_invite' | 'voice' | 'call' | 'system';
  extraData?: {
    bookingId?: string;
    venueName?: string;
    qrCode?: string;
    callType?: 'audio' | 'video';
    callDuration?: string;
    callStatus?: 'completed' | 'missed' | 'declined';
    audioUrl?: string;
    audioDuration?: number;
  };
}

export interface SafetyContact {
  name: string;
  phone: string;
}