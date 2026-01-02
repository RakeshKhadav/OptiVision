import { Request, Response } from 'express';
import { ApiError } from '../utility/ApiError.js';
import { asyncHandler } from '../utility/asyncHandler.js';
import { prisma } from '../prismaClient.js';
import ApiResponse from '../utility/ApiResponse.js';
import { getIO } from '../services/socketService.js';

const createActivity = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { workerId, action, startTime, endTime, duration, cameraId } = req.body;

    if (!workerId || !action || !startTime || !endTime || !duration || !cameraId) {
      throw new ApiError(400, 'Missing required fields');
    }

    const activity = await prisma.activityLog.create({
      data: {
        workerId,
        action,
        startTime,
        endTime,
        duration,
        camera: {
          connect: {
            id: cameraId,
          },
        },
      },
    });

    if (!activity) {
      throw new ApiError(500, 'Failed to create an activity log.');
    }

    getIO().emit('activity_log', activity);

    res.status(201).json(new ApiResponse(201, activity, 'Activity log created successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to create activity: ${error}`);
  }
});

export { createActivity };
