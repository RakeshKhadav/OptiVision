import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utility/asyncHandler';
import { ApiError } from '../utility/ApiError';
import { prisma } from '../prismaClient';
import bcrypt from 'bcrypt';
import { generateToken } from '../utility/jwt';
import ApiResponse from '../utility/ApiResponse';

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, role = 'USER', password } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(400, 'All fields are required.');
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, 'Invalid email format.');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError(400, 'User already exists.');
    }

    //Hash password
    const hasedPassword = await bcrypt.hash(password, 12);

    //Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        password: hasedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    if (!newUser) {
      throw new ApiError(500, 'Failed to create user.');
    }

    return res
      .status(201)
      .json(new ApiResponse(201, { newUser, token }, 'User created successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to create user: ${error}`);
  }
});

export { registerUser };
