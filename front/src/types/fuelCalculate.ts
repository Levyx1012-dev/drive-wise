export interface FuelCalculateRequest {
  vehicle: number;
  distanceKm: number;
  gasolinePrice?: number;
  ethanolPrice?: number;
  dieselPrice?: number;
}

export interface FuelOption {
  fuel: 'gasolina' | 'etanol' | 'diesel';
  consumptionKmL: number;
  litersNeeded: number;
  pricePerLiter: number | null;
  totalCost: number | null;
}

export interface FuelCalculateResult {
  vehicleId: number;
  vehicleName: string;
  distanceKm: number;
  options: FuelOption[];
}
