import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError.js';

cloudinary.config({ secure: true });

export const uploadBase64ToCloudinary = async (base64String: string) => {
  try {
    if (!base64String) return null;

    // Upload the base64 string directly
    const response = await cloudinary.uploader.upload(base64String, {
      resource_type: 'auto',
    });

    return response;
  } catch (error) {
    throw new ApiError(500, `Failed to upload base64 image to Cloudinary: ${error}`);
  }
};
