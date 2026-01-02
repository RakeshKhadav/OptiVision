import { Request, Response } from 'express';
import { asyncHandler } from '../utility/asyncHandler.js';
import { ApiError } from '../utility/ApiError.js';
import { prisma } from '../prismaClient.js';
import { getIO } from '../services/socketService.js';
import { uploadBase64ToCloudinary } from '../utility/cloudinaryUploadFile.js';
import ApiResponse from '../utility/ApiResponse.js';

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

    res.status(201).json(new ApiResponse(201, newAlert, 'Alert created successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to create alert: ${error}`);
  }
});

const getAlert = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;

    // Build the where clause for date filtering
    const whereClause: { createdAt?: { gte: Date; lte: Date } } = {};

    if (start && end) {
      whereClause.createdAt = {
        gte: new Date(start as string),
        lte: new Date(end as string),
      };
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        severity: true,
        message: true,
        snapshot: true,
        isResolved: true,
        cameraId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      // If no date range provided, limit to last 50 alerts
      ...(!(start && end) && { take: 50 }),
    });
    res.status(200).json(new ApiResponse(200, alerts, 'Alerts fetched successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to get alert: ${error}`);
  }
});

const resolveAlert = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resolvedAlert = await prisma.alert.update({
      where: { id: Number(id) },
      data: { isResolved: true },
      select: {
        id: true,
        type: true,
        severity: true,
        message: true,
        snapshot: true,
        isResolved: true,
        cameraId: true,
        createdAt: true,
      },
    });

    if (!resolvedAlert) {
      throw new ApiError(404, 'Alert not found');
    }

    getIO().emit('alert_resolved', resolvedAlert);

    res.status(200).json(new ApiResponse(200, resolvedAlert, 'Alert resolved successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to resolve alert: ${error}`);
  }
});

export { createAlert, getAlert, resolveAlert };
