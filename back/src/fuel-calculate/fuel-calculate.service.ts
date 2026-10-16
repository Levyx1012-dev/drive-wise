import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFuelCalculateDto } from './dto/create-fuel-calculate.dto';
import { PrismaService } from '../database/prisma.service';

export interface FuelOption {
  fuel: 'gasolina' | 'etanol' | 'diesel';
  consumptionKmL: number;
  litersNeeded: number;
  pricePerLiter: number | null;
  totalCost: number | null;
}

@Injectable()
export class FuelCalculateService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateFuelCalculateDto) {
    const vehicle = await this.prismaService.vehicle.findUnique({
      where: { id: dto.vehicle },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo ${dto.vehicle} não encontrado`);
    }

    const fuelDefs = [
      {
        fuel: 'gasolina' as const,
        city: vehicle.consumptionCityG,
        hwy: vehicle.consumptionHwyG,
        price: dto.gasolinePrice,
      },
      {
        fuel: 'etanol' as const,
        city: vehicle.consumptionCityE,
        hwy: vehicle.consumptionHwyE,
        price: dto.ethanolPrice,
      },
      {
        fuel: 'diesel' as const,
        city: vehicle.consumptionCityD,
        hwy: vehicle.consumptionHwyD,
        price: dto.dieselPrice,
      },
    ];

    const options: FuelOption[] = [];

    for (const def of fuelDefs) {
      // Prioriza o consumo rodoviário (a viagem calculada é ponto a ponto,
      // predominantemente estrada); cai para o consumo urbano só se não
      // houver valor rodoviário cadastrado.
      const consumption = def.hwy ?? def.city;
      if (consumption == null) continue; // veículo não roda com esse combustível

      const litersNeeded = dto.distanceKm / consumption;
      const totalCost = def.price != null ? Number((litersNeeded * def.price).toFixed(2)) : null;

      options.push({
        fuel: def.fuel,
        consumptionKmL: consumption,
        litersNeeded: Number(litersNeeded.toFixed(2)),
        pricePerLiter: def.price ?? null,
        totalCost,
      });
    }

    if (options.length === 0) {
      throw new BadRequestException(
        'Este veículo não possui dados de consumo por litro cadastrados (ex.: veículo 100% elétrico).',
      );
    }

    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.fullName,
      distanceKm: dto.distanceKm,
      options,
    };
  }
}
