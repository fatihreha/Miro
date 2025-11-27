import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  age: number;
  location: string;
  avatarUrl?: string;
  bio?: string;
  interests?: string[];
  level?: 'Beginner' | 'Intermediate' | 'Pro';
  isPremium?: boolean;
  xp?: number;
  userLevel?: number;
  matchPercentage?: number;
  workoutTimePreference?: 'Morning' | 'Evening' | 'Any';
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    unlocked: boolean;
    dateUnlocked?: Date;
  }>;
  isTrainer?: boolean;
  hourlyRate?: number;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  location: { type: String, required: true },
  avatarUrl: { type: String, default: 'https://i.pravatar.cc/300' },
  bio: { type: String },
  interests: [{ type: String }], 
  level: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Pro'],
    default: 'Beginner'
  },
  isPremium: { type: Boolean, default: false },
  xp: { type: Number, default: 0 },
  userLevel: { type: Number, default: 1 },
  matchPercentage: { type: Number },
  workoutTimePreference: { 
    type: String, 
    enum: ['Morning', 'Evening', 'Any'],
    default: 'Any'
  },
  badges: [{
    id: String,
    name: String,
    icon: String,
    description: String,
    unlocked: Boolean,
    dateUnlocked: Date
  }],
  isTrainer: { type: Boolean, default: false },
  hourlyRate: { type: Number },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  specialties: [{ type: String }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next: (err?: Error) => void) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password || '');
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;