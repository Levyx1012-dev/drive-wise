// services/vehicles.api.ts
import { api } from './api';
import { type Vehicle, type VehicleCreate } from '../types/vehicles';

export const VehiclesService = {

  search: async (searchTerm: string): Promise<Vehicle[]> => {
    // GET /vehicles é público (não exige login) e já retorna os campos de
    // consumo — mantemos tudo aqui para a calculadora saber quais
    // combustíveis o veículo aceita, sem precisar de GET /vehicles/:id
    // (esse sim exige ADMIN, não dá pra chamar no fluxo público).
    const data = await api.get<any>(`/vehicles?search=${searchTerm}`, false);
    const rawList = Array.isArray(data) ? data : data.data || [];

    return rawList.map((vehicle: any) => ({
      id: vehicle.id,
      fullName: vehicle.fullName,
      category: vehicle.category,
      consumptionCityG: vehicle.consumptionCityG,
      consumptionHwyG: vehicle.consumptionHwyG,
      consumptionCityE: vehicle.consumptionCityE,
      consumptionHwyE: vehicle.consumptionHwyE,
      consumptionCityD: vehicle.consumptionCityD,
      consumptionHwyD: vehicle.consumptionHwyD,
    }));
  },

  getById: async (id: number): Promise<VehicleCreate> => {
    return api.get<VehicleCreate>(`/vehicles/${id}`, true);
  },

  create: async (vehicleData: Partial<VehicleCreate>) => {
    return api.post<VehicleCreate>('/vehicles', vehicleData, true);
  },

  update: async (id: number, vehicleData: Partial<VehicleCreate>) => {
    return api.patch<VehicleCreate>(`/vehicles/${id}`, vehicleData, true);
  },

  delete: async (id: number) => {
    return api.delete<void>(`/vehicles/${id}`, true);
  },
};