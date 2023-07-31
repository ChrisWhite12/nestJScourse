import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HomeResponseDto } from './dto/home.dto';
import { PropertyType } from '@prisma/client';

interface GetHomesParam {
  city?: string;
}

interface CreateHomeParams {
  address: string;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  city: string;
  landSize: number;
  propertyType: PropertyType;
  images: { url: string }[];
}

interface UpdateHomeParams {
  address?: string;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  city?: string;
  landSize?: number;
  propertyType?: PropertyType;
}

@Injectable()
export class HomeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHomes(filters: GetHomesParam): Promise<HomeResponseDto[]> {
    const homes = await this.prismaService.home.findMany({
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

    if (!homes.length) {
      throw new NotFoundException();
    }

    return homes.map((home) => new HomeResponseDto(home));
  }

  async getHomeById(id: number): Promise<HomeResponseDto> {
    const home = await this.prismaService.home.findUnique({
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
      where: {
        id: id,
      },
    });

    return new HomeResponseDto(home);
  }

  async createHome(
    {
      address,
      city,
      landSize,
      numberOfBathrooms,
      numberOfBedrooms,
      propertyType,
      images,
    }: CreateHomeParams,
    id: number,
  ) {
    const home = await this.prismaService.home.create({
      data: {
        address,
        city,
        land_size: landSize,
        number_bathrooms: numberOfBathrooms,
        number_bedrooms: numberOfBedrooms,
        property_type: propertyType,
        realtor_id: id,
      },
    });

    const homeImages = images.map((image) => {
      return { ...image, home_id: home.id };
    });

    await this.prismaService.image.createMany({
      data: homeImages,
    });

    return new HomeResponseDto(home);
  }

  async updateHome(id: number, data: UpdateHomeParams) {
    const home = this.prismaService.home.findUnique({
      where: { id },
    });

    if (!home) {
      throw new NotFoundException();
    }

    const updatedHome = await this.prismaService.home.update({
      where: { id },
      data,
    });

    return new HomeResponseDto(updatedHome);
  }

  async deleteHome(id: number) {
    await this.prismaService.image.deleteMany({
      where: { home_id: id },
    });
    this.prismaService.home.delete({ where: { id } });
    return;
  }

  async getRealtorByHomeId(id: number) {
    const home = await this.prismaService.home.findUnique({
      where: { id },
      select: {
        realtor: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    if (!home) {
      throw new NotFoundException();
    }

    return home.realtor;
  }
}
