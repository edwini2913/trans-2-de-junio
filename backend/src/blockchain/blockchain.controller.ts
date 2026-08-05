import { Controller, Get } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('resumen')
  obtenerResumen() {
    return this.blockchainService.obtenerResumen();
  }

  @Get('verificar-cadena')
  async verificarCadena() {
    const cadenaValida = await this.blockchainService.verificarCadena();
    return {
      ok: cadenaValida,
      cadenaValida,
      mensaje: cadenaValida
        ? 'La cadena blockchain está íntegra.'
        : 'La cadena blockchain presenta alteraciones.',
    };
  }
}
