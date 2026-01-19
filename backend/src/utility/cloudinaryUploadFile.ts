import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadBase64ToCloudinary = async (base64String: string) => {
  try {
    if (!base64String) return null;

    // Upload the base64 string directly
    const response = await cloudinary.uploader.upload(base64String, {
      resource_type: 'auto',
    });

    return response;
  } catch (error) {
    console.error('Cloudinary Upload Error:', JSON.stringify(error, null, 2));
    // If it's a specific error from Cloudinary, try to extract the message
    const cleanError = error instanceof Error ? error.message : JSON.stringify(error);
    throw new ApiError(500, `Failed to upload base64 image to Cloudinary: ${cleanError}`);
  }
};
