import { Request, Response } from 'express';
import { asyncHandler } from '../utility/asyncHandler.js';
import { ApiError } from '../utility/ApiError.js';
import { prisma } from '../prismaClient.js';
import { getIO } from '../services/socketService.js';
import { uploadBase64ToCloudinary } from '../utility/cloudinaryUploadFile.js';

const createAlert = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { type, severity, message, snapshot, isResolved, cameraId } = req.body;

    if (!type || !severity || !message || !cameraId) {
      throw new ApiError(400, 'All fields are required');
    }

    let snapshotUrl = '';
    if (snapshot) {
      const uploadResponse = await uploadBase64ToCloudinary(snapshot);
      if (uploadResponse) {
        snapshotUrl = uploadResponse.secure_url;
      }
    }

    const newAlert = await prisma.alert.create({
      data: {
        type,
        severity,
        message,
        snapshot: snapshotUrl,
        isResolved: isResolved || false,
        camera: {
          connect: {
            id: cameraId,
          },
        },
      },
    });

    if (!newAlert) {
      throw new ApiError(500, 'Failed to create alert');
    }

    getIO().emit('alert', newAlert);

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: newAlert,
    });
  } catch (error) {
    throw new ApiError(500, `Failed to create alert: ${error}`);
  }
});

export { createAlert };
