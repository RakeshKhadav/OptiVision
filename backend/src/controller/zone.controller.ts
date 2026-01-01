import { Request, Response } from 'express';
import { asyncHandler } from '../utility/asyncHandler';
import { ApiError } from '../utility/ApiError';
import { prisma } from '../prismaClient';
import { getIO } from '../services/socketService';
import ApiResponse from '../utility/ApiResponse';

const createZone = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, type, coordinates, cameraId } = req.body;
    if (!name || !type || !coordinates || !cameraId) {
      throw new ApiError(400, 'All fields are required');
    }
    const newZone = await prisma.zone.create({
      data: {
        name,
        type,
        coordinates,
        camera: {
          connect: {
            id: cameraId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        coordinates: true,
        cameraId: true,
      },
    });

    if (!newZone) {
      throw new ApiError(500, 'Failed to create zone');
    }

    getIO().emit('zoneCreated', newZone);

    res.status(201).json(new ApiResponse(201, newZone, 'Zone created successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to create zone: ${error}`);
  }
});

const getZones = asyncHandler(async (req: Request, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        coordinates: true,
        cameraId: true,
      },
    });
    res.status(200).json(new ApiResponse(200, zones, 'Zones fetched successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to get zones: ${error}`);
  }
});

const deleteZone = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedZone = await prisma.zone.delete({
      where: {
        id: Number(id),
      },
    });

    if (!deletedZone) {
      throw new ApiError(404, 'Zone not found');
    }

    getIO().emit('zoneDeleted', deletedZone);

    res.status(200).json(new ApiResponse(200, deletedZone, 'Zone deleted successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to delete zone: ${error}`);
  }
});
export { createZone, getZones, deleteZone };
