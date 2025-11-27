import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';

// Generate JWT
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }) as IUser;

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isPremium: user.isPremium,
        token: generateToken(user._id.toString()),
        interests: user.interests,
        level: user.level,
        location: user.location
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, age, location, interests, level, workoutTimePreference } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      age,
      location,
      interests,
      level,
      workoutTimePreference
    }) as IUser;

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isPremium: user.isPremium,
        token: generateToken(user._id.toString())
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};