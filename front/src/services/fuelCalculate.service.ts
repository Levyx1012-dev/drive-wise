import { api } from './api';
import type { FuelCalculateRequest, FuelCalculateResult } from '../types/fuelCalculate';

export const FuelCalculateService = {
  calculate: async (data: FuelCalculateRequest): Promise<FuelCalculateResult> => {
    return api.post<FuelCalculateResult>('/fuel-calculate', data, false);
  },
};
