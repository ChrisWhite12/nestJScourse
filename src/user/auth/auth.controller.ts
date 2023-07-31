import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GenerateKeyDto, SigninDto, SignupDto } from '../auth.dto';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { User } from '../decorators/user.decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup/:userType')
  async signup(
    @Body() body: SignupDto,
    @Param('userType', new ParseEnumPipe(UserType)) userType: UserType,
  ) {
    if (userType !== UserType.BUYER) {
      if (!body.productKey) {
        throw new UnauthorizedException();
      }

      const validProductKey = `${body.email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;
      const isValid = await bcrypt.compare(validProductKey, body.productKey);
      if (!isValid) {
        throw new UnauthorizedException();
      }
    }

    return this.authService.signup(body, userType);
  }

  @Post('/signin')
  signin(@Body() body: SigninDto) {
    return this.authService.signin(body);
  }

  @Post('/key')
  generateKey(@Body() { email, type }: GenerateKeyDto) {
    return this.authService.generateProductKey(email, type);
  }

  @Get('/me')
  me(@User() user) {
    return user;
  }
}
