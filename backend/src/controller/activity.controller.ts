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

const getAllActivities = asyncHandler(async (req: Request, res: Response) => {
  try {
    const activities = await prisma.activityLog.findMany({
      select: {
        id: true,
        workerId: true,
        action: true,
        startTime: true,
        endTime: true,
        duration: true,
        camera: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    res.status(200).json(new ApiResponse(200, activities, 'Activities retrieved successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to retrieve activities: ${error}`);
  }
});

const getStatsOfActivities = asyncHandler(async (req: Request, res: Response) => {
  try {
    const activityStats = await prisma.activityLog.groupBy({
      by: ['action'],
      _sum: {
        duration: true,
      },
    });

    const alertStats = await prisma.alert.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    const stats = {
      activityStats,
      alertStats,
    };

    if (!stats) {
      throw new ApiError(404, 'No stats found');
    }

    getIO().emit('activity_log_stats', stats);

    res.status(200).json(new ApiResponse(200, stats, 'Activities stats retrieved successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to retrieve activities stats: ${error}`);
  }
});

export { createActivity, getAllActivities, getStatsOfActivities };
