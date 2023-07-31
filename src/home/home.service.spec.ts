import { Test, TestingModule } from '@nestjs/testing';
import { HomeService } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const mockHomes = [
  {
    id: 1,
    address: 'test',
    city: 'city',
    land_size: 123132,
    number_bathrooms: 2,
    number_bedrooms: 4,
    property_type: PropertyType.CONDO,
    realtor_id: 2,
    images: [
      {
        url: 'src1',
      },
    ],
  },
];

const mockHome = {
  id: 1,
  address: 'test',
  city: 'city',
  land_size: 123132,
  number_bathrooms: 2,
  number_bedrooms: 4,
  property_type: PropertyType.CONDO,
  realtor_id: 2,
};

const mockImages = [
  {
    home_id: 1,
    url: 'src1',
  },
  {
    home_id: 2,
    url: 'src2',
  },
];

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockHomes),
              create: jest.fn().mockReturnValue(mockHome),
            },
            image: {
              createMany: jest.fn().mockReturnValue(mockImages),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHomes', () => {
    const filters = {
      city: 'brisbane',
      propertyType: PropertyType.RESIDENTIAL,
    };

    it('should call prisma home.findMany', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockHomes);
      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await service.getHomes(filters);
      expect(mockPrismaFindManyHomes).toBeCalledWith({
        select: {
          id: true,
          address: true,
          city: true,
          property_type: true,
          number_bathrooms: true,
          number_bedrooms: true,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        where: filters,
      });
    });

    it('should throw error when no homes found', () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);
      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      expect(service.getHomes(filters)).rejects.toThrowError(NotFoundException);
    });
  });

  describe('create Home', () => {
    const mockCreateHomeParams = {
      address: 'test',
      city: 'city',
      landSize: 123132,
      numberOfBathrooms: 2,
      numberOfBedrooms: 4,
      propertyType: PropertyType.CONDO,
      realtor_id: 2,
      images: [
        {
          url: 'src1',
        },
      ],
    };

    it('should create home', async () => {
      const mockCreateHome = jest.fn().mockReturnValue(mockHome);
      jest
        .spyOn(prismaService.home, 'create')
        .mockImplementation(mockCreateHome);

      await service.createHome(mockCreateHomeParams, 1);

      expect(mockCreateHome).toBeCalledWith({
        data: {
          address: 'test',
          city: 'city',
          land_size: 123132,
          number_bathrooms: 2,
          number_bedrooms: 4,
          property_type: PropertyType.CONDO,
          realtor_id: 1,
        },
      });
    });

    it('should call image.createMany', async () => {
      const mockCreateImages = jest.fn().mockReturnValue(mockImages);
      jest
        .spyOn(prismaService.image, 'createMany')
        .mockImplementation(mockCreateImages);

      await service.createHome(mockCreateHomeParams, 1);
      expect(mockCreateImages).toBeCalledWith({
        data: [
          {
            url: 'src1',
            home_id: 1,
          },
        ],
      });
    });
  });
});
