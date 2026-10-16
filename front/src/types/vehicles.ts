export interface Vehicle {
  id: number;
  fullName: string;
  category?: string;
  consumptionCityG?: number | null;
  consumptionHwyG?: number | null;
  consumptionCityE?: number | null;
  consumptionHwyE?: number | null;
  consumptionCityD?: number | null;
  consumptionHwyD?: number | null;
}

export interface VehicleCreate {

    brand: string,
    model: string,
    version: string,
    year: number,
    category: string,
    consumptionCityG?: number,
    consumptionHwyG?: number,
    consumptionCityE?: number,
    consumptionHwyE?: number,
    consumptionHwyD?: number,
    consumptionCityD?: number,

}
