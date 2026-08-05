import { Controller, Delete, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  obtenerTodos() {
    return this.usersService.obtenerTodos();
  }

  @Delete(':id')
  eliminarUsuario(@Param('id') id: string) {
    return this.usersService.eliminarUsuario(id);
  }
}