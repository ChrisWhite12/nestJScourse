import { Test, TestingModule } from '@nestjs/testing';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

const mockUser = {
  id: 10,
  name: 'aa',
  email: 'a@a.com',
  phone: '12341',
};

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

describe('HomeController', () => {
  let controller: HomeController;
  let service: HomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: HomeService,
          useValue: {
            getHomes: jest.fn().mockReturnValue([]),
            getRealtorByHomeId: jest.fn().mockReturnValue(mockUser),
            updateHome: jest.fn().mockReturnValue(mockHome),
          },
        },
        PrismaService,
      ],
    }).compile();

    controller = module.get<HomeController>(HomeController);
    service = module.get<HomeService>(HomeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHomes', () => {
    it('should filter correctly', async () => {
      const mockGetHomes = jest.fn().mockReturnValue([]);
      jest.spyOn(service, 'getHomes').mockImplementation(mockGetHomes);
      await controller.getHomes('brisbane');

      expect(mockGetHomes).toBeCalledWith({
        city: 'brisbane',
      });
    });
  });

  describe('update Home', () => {
    const mockUpdateHomeParams = {
      address: 'test',
      city: 'city',
      landSize: 123132,
      numberOfBathrooms: 2,
      numberOfBedrooms: 4,
      propertyType: PropertyType.CONDO,
    };

    const mockUserInfo = {
      name: 'chris',
      id: 1,
      iat: 1,
      exp: 1,
    };

    it('should throw if not same realtor', async () => {
      await expect(
        controller.updateHome(5, mockUpdateHomeParams, mockUserInfo),
      ).rejects.toThrowError(UnauthorizedException);
    });

    it('should update home', async () => {
      const mockUpdateHome = jest.fn().mockReturnValue(mockHome);
      jest.spyOn(service, 'updateHome').mockImplementation(mockUpdateHome);

      await controller.updateHome(5, mockUpdateHomeParams, {
        ...mockUserInfo,
        id: 10,
      });

      expect(mockUpdateHome).toBeCalled();
    });
  });
});
