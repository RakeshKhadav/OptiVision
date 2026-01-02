import { Request, Response } from 'express';
import { asyncHandler } from '../utility/asyncHandler.js';
import { ApiError } from '../utility/ApiError.js';
import { prisma } from '../prismaClient.js';
import { getIO } from '../services/socketService.js';
import ApiResponse from '../utility/ApiResponse.js';

const createCamera = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, status = 'ONLINE', calibrationData } = req.body;

    if (!name) {
      throw new ApiError(400, 'Camera name is required');
    }

    const newCamera = await prisma.camera.create({
      data: {
        name,
        status,
        calibrationData,
      },
      select: {
        id: true,
        name: true,
        status: true,
        calibrationData: true,
      },
    });

    if (!newCamera) {
      throw new ApiError(500, 'Failed to create camera');
    }

    getIO().emit('camera_created', newCamera);

    res.status(201).json(new ApiResponse(201, newCamera, 'Camera created successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to create camera: ${error}`);
  }
});

const getCameras = asyncHandler(async (req: Request, res: Response) => {
  try {
    const cameras = await prisma.camera.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        calibrationData: true,
        zones: {
          select: {
            id: true,
            name: true,
            type: true,
            coordinates: true,
          },
        },
      },
    });
    res.status(200).json(new ApiResponse(200, cameras, 'Cameras fetched successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to get cameras: ${error}`);
  }
});

const getCameraById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const camera = await prisma.camera.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        status: true,
        calibrationData: true,
        zones: {
          select: {
            id: true,
            name: true,
            type: true,
            coordinates: true,
          },
        },
        alerts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            severity: true,
            message: true,
            isResolved: true,
            createdAt: true,
          },
        },
      },
    });

    if (!camera) {
      throw new ApiError(404, 'Camera not found');
    }

    res.status(200).json(new ApiResponse(200, camera, 'Camera fetched successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to get camera: ${error}`);
  }
});

const updateCamera = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status, calibrationData } = req.body;

    const updatedCamera = await prisma.camera.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(calibrationData !== undefined && { calibrationData }),
      },
      select: {
        id: true,
        name: true,
        status: true,
        calibrationData: true,
      },
    });

    getIO().emit('camera_updated', updatedCamera);

    res.status(200).json(new ApiResponse(200, updatedCamera, 'Camera updated successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to update camera: ${error}`);
  }
});

const deleteCamera = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedCamera = await prisma.camera.delete({
      where: { id: Number(id) },
    });

    if (!deletedCamera) {
      throw new ApiError(404, 'Camera not found');
    }

    getIO().emit('camera_deleted', { id: Number(id) });

    res.status(200).json(new ApiResponse(200, deletedCamera, 'Camera deleted successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to delete camera: ${error}`);
  }
});

export { createCamera, getCameras, getCameraById, updateCamera, deleteCamera };
