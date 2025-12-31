import { prisma } from '../prismaClient';

export async function seed() {
  try {
    await prisma.camera.create({
      data: {
        name: 'Main Feed',
        status: 'ONLINE',
        zones: {
          create: {
            name: 'Zone 1',
            type: 'SAFE',
            coordinates: '0 0 0',
          },
        },
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
