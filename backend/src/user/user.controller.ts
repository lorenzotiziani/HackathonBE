import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ZodParamPipe } from 'src/common/pipes/zod-param-pipe';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtPayload } from 'src/auth/entities/auth.entity';
import z from 'zod';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  getProfile(@Req() req: Request & { user: JwtPayload }) {
    return this.userService.findOne(req.user.userId);
  }

  /* 
  per il momento non usabile visto che non prevedo admin
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all users (admin only)' })
  findAll() {
    return this.userService.findAll();
  }
  

  @Get('id/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  */

  @Get('email')
  @ApiOperation({ summary: 'Find user by email' })
  findByEmail(
    @Body('email', new ZodParamPipe(z.string().email())) email: string,
  ) {
    return this.userService.findByEmail(email);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user by ID (admin only)' })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
