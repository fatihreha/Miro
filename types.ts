
export enum SportType {
  TENNIS = 'Tennis',
  RUNNING = 'Running',
  GYM = 'Gym',
  YOGA = 'Yoga',
  CYCLING = 'Cycling',
  BASKETBALL = 'Basketball',
  SWIMMING = 'Swimming',
  HIKING = 'Hiking',
  BOXING = 'Boxing',
  FOOTBALL = 'Football',
  VOLLEYBALL = 'Volleyball',
  BADMINTON = 'Badminton',
  BASEBALL = 'Baseball',
  RUGBY = 'Rugby',
  GOLF = 'Golf',
  MMA = 'MMA',
  CROSSFIT = 'CrossFit',
  PILATES = 'Pilates',
  DANCE = 'Dance',
  SKATEBOARDING = 'Skateboarding',
  SURFING = 'Surfing',
  SKIING = 'Skiing',
  SNOWBOARDING = 'Snowboarding',
  CLIMBING = 'Climbing'
}

export enum LocationType {
  GYM = 'Gym',
  PARK = 'Park',
  COURT = 'Court',
  ROUTE = 'Route',
  POOL = 'Pool',
  SALON = 'Salon',
  STADIUM = 'Stadium',
  YOGA = 'Yoga Studio',
  BOXING = 'Boxing Gym',
  DANCE = 'Dance Studio',
  MARTIAL_ARTS = 'Martial Arts',
  CLIMBING = 'Climbing Wall',
  TENNIS = 'Tennis Court',
  BASKETBALL = 'Basketball Court',
  FOOTBALL = 'Football Field',
  VOLLEYBALL = 'Volleyball Court',
  GOLF = 'Golf Course',
  SKATE = 'Skate Park',
  TRACK = 'Running Track',
  CYCLING = 'Cycling Path',
  BEACH = 'Beach',
  CROSSFIT = 'CrossFit Box'
}

export enum ReportReason {
  HARASSMENT = 'Harassment or Bullying',
  INAPPROPRIATE_CONTENT = 'Inappropriate Content',
  SPAM = 'Spam or Scam',
  FAKE_PROFILE = 'Fake Profile',
  OFFENSIVE_LANGUAGE = 'Offensive Language',
  OTHER = 'Other'
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  details: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface ActivityRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  sport: SportType;
  date: string;
  time: string;
  location: string;
  note?: string;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed';
  timestamp: Date;
  // Workout session tracking
  attendanceUpdate?: 'on_time' | 'late' | 'missed';
  startedAt?: string;
  completedAt?: string;
  // Training Prep Room fields
  senderReady?: boolean;
  receiverReady?: boolean;
  senderLevel?: string;
  senderDistance?: string;
  noShowReason?: string;
}

export interface PhotoComment {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  photoIndex: number;
}

export interface MapLocation {
  id: string;
  name: string;
  type: LocationType;
  coordinates: { lat: number, lng: number }; // Real GPS coordinates
  rating: number;
  reviews: number;
  description: string;
  image: string;
  addedBy?: string;
  verified: boolean;
  status?: 'active' | 'pending';
  isSponsored?: boolean;
  contact?: string;
  website?: string;
  address?: string;
  hours?: string;
  tags?: string[];
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  price: number;
}

export interface ProFinanceSettings {
  bankName: string;
  iban: string;
  accountHolder: string;
  billingType: 'individual' | 'company';
  taxId: string; // TCKN or VKN
  companyName?: string; // Required if company
  taxOffice?: string; // Required if company
  billingAddress: string;
  payoutFrequency: 'weekly' | 'biweekly' | 'monthly';
}

export interface User {
  id: string;
  name: string;
  email?: string;
  age: number;
  gender?: 'Male' | 'Female' | 'Non-binary' | 'Other'; // Added for filtering
  bio: string;
  location: string;
  avatarUrl: string;
  photos?: string[]; // Multi-photo profile support (up to 6 photos, first photo = avatarUrl)
  photoComments?: PhotoComment[]; // Comments on user's photos
  interests: SportType[];
  level: 'Beginner' | 'Intermediate' | 'Pro';
  distance?: string;
  matchPercentage?: number; // Added for AI matching
  aiPersona?: string; // Added for AI analysis result
  matchReason?: string; // Added for AI compatibility reasoning
  keyFactors?: string[]; // Added for detailed compatibility breakdown
  isPremium?: boolean;
  xp?: number;
  userLevel?: number;
  streak?: number;
  lastActiveDate?: string;
  badges?: Badge[];
  workoutTimePreference?: 'Morning' | 'Evening' | 'Any' | 'Anytime'; // Any=app, Anytime=DB
  preferences?: {
    maxDistance: number;
    maxAge: number;
  };

  // Swipe Limiting
  dailySwipes?: number; // Remaining swipes for the day
  lastSwipeReset?: string; // ISO Date string of last reset

  // Trainer / Marketplace Fields
  isTrainer?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'none';
  yearsExperience?: number;
  certificates?: string[]; // names of uploaded files
  hourlyRate?: number;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];

  // Pro Dashboard Fields
  availability?: {
    days: string[]; // e.g., ['Mon', 'Wed', 'Fri']
    startHour: string; // "09:00"
    endHour: string; // "17:00"
  };
  bookings?: Booking[];
  proFinance?: ProFinanceSettings;

  // Enhanced Onboarding Fields
  diet?: string;
  supplements?: string[];
  funFact?: string;
  widgetStyle?: string;
  workoutEnvironment?: string[];
  fitnessGoal?: string;

  // Location Fields
  latitude?: number;
  longitude?: number;
  showLocation?: boolean;
  coverPhotoUrl?: string;
}

// Flattened trainer profile used in UI after mapping Supabase rows
export interface TrainerProfile {
  id: string; // trainers.id used for navigation
  trainerId: string; // explicit trainers.id for booking/detail
  userId: string; // users.id owner
  name: string;
  avatarUrl: string;
  location?: string;
  gender?: 'Male' | 'Female' | 'Non-binary' | 'Other';
  age?: number;
  specialties: string[];
  interests: SportType[];
  level?: 'Beginner' | 'Intermediate' | 'Pro';
  hourlyRate?: number;
  rating?: number;
  reviewCount?: number;
  isTrainer?: boolean;
  distanceKm?: number; // computed client-side when coords available
  bio?: string;
}

export interface Club {
  id: string;
  ownerId?: string; // Added for management
  name: string;
  members: number;
  sport: SportType;
  image: string;
  nextEvent?: string;
  isMember?: boolean;
  membershipStatus?: 'guest' | 'pending' | 'member'; // Added for request flow
  coordinates?: { x: number, y: number };
  isSponsored?: boolean; // Monetization field
  description?: string;
  location?: string; // Add location property
  rules?: string[]; // Added for management
  applications?: number; // Added for management
}

export interface Badge {
  id: string;
  name: string;
  icon: string; // emoji or lucide icon name
  description: string;
  unlocked: boolean;
  dateUnlocked?: Date;
}

export interface WorkoutInvite {
  activity: SportType;
  date: string;
  time: string;
  duration?: string;
  location: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface WorkoutPlan {
  title: string;
  focus: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    rest?: string;
  }[];
}

export interface Message {
  id: string;
  senderId: string;
  recipientId?: string; // Added for filtering chat rooms
  senderName?: string; // Added for group chat
  senderAvatar?: string; // Added for group chat
  text: string;
  timestamp: Date;
  isAiGenerated?: boolean;
  isFlagged?: boolean; // New field for safety check
  isRead?: boolean; // Read receipt status
  type?: 'text' | 'invite';
  inviteDetails?: WorkoutInvite;
  image?: string; // Base64 string for image messages
  workoutPlan?: WorkoutPlan; // For structured workout plans
}

export interface ChatSession {
  userId: string;
  messages: Message[];
}

export interface SubscriptionPackage {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL';
  priceString: string;
  title: string;
  description: string;
  savings?: string;
  tier?: 'GOLD' | 'PRO';
}

export interface SportEvent {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  sport: SportType;
  date: string;
  time: string;
  location: string;
  description: string;
  attendees: number;
  attendeeAvatars?: string[];
  isJoined?: boolean;
  attendanceStatus?: 'guest' | 'pending' | 'going'; // Added for request flow
  rules?: string[]; // Event rules
  notes?: string; // Private notes for attendees
}