import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserType } from '@prisma/client';

interface SignupParams {
  email: string;
  password: string;
  name: string;
  phone: string;
}

interface SigninParams {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signup(
    { email, password, name, phone }: SignupParams,
    userType: UserType,
  ) {
    console.log('email', email);
    const userExists = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (userExists) {
      throw new ConflictException();
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await this.prismaService.user.create({
      data: {
        email,
        name,
        password: hashPassword,
        phone,
        user_type: userType,
      },
    });

    return await this.generateJWT(user.name, user.id);
  }

  async signin({ email, password }: SigninParams) {
    // find email
    const userExists = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!userExists) {
      return new HttpException('Invalid Credentials', 400);
    }

    // validate pass
    const isValidPassword = await bcrypt.compare(password, userExists.password);
    if (!isValidPassword) {
      return new HttpException('Invalid Credentials', 400);
    }

    // return jwt
    return await this.generateJWT(userExists.name, userExists.id);
  }

  private async generateJWT(name: string, id: number) {
    const token = await jwt.sign(
      {
        name,
        id,
      },
      process.env.JSON_KEY,
      {
        expiresIn: 36000,
      },
    );

    return token;
  }

  generateProductKey(email: string, userType: UserType) {
    const string = `${email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;
    return bcrypt.hash(string, 10);
  }
}
