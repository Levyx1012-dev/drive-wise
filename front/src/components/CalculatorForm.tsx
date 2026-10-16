import { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { VehicleSelect } from './VehicleSelect';
import { FuelCalculateService } from '../services/fuelCalculate.service';
import type { Vehicle } from '../types/vehicles';
import type { FuelCalculateResult } from '../types/fuelCalculate';

interface CalculatorFormProps {
  onToggle?: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
}

const libraries: ('places')[] = ['places'];

const FUEL_LABELS: Record<string, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
};

function hasFuel(vehicle: Vehicle, city: keyof Vehicle, hwy: keyof Vehicle) {
  return vehicle[city] != null || vehicle[hwy] != null;
}

export function CalculatorForm({
  onToggle,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: CalculatorFormProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [gasolinePrice, setGasolinePrice] = useState('');
  const [ethanolPrice, setEthanolPrice] = useState('');
  const [dieselPrice, setDieselPrice] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FuelCalculateResult | null>(null);

  // Reaproveita o script do Google Maps já carregado pelo MapContainer (mesmo
  // id de script) só para acessar DirectionsService, sem renderizar nada.
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const acceptsGasoline = selectedVehicle ? hasFuel(selectedVehicle, 'consumptionCityG', 'consumptionHwyG') : false;
  const acceptsEthanol = selectedVehicle ? hasFuel(selectedVehicle, 'consumptionCityE', 'consumptionHwyE') : false;
  const acceptsDiesel = selectedVehicle ? hasFuel(selectedVehicle, 'consumptionCityD', 'consumptionHwyD') : false;
  const isElectricOnly = selectedVehicle != null && !acceptsGasoline && !acceptsEthanol && !acceptsDiesel;

  function getRouteDistanceKm(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!isLoaded || !window.google) {
        reject(new Error('O mapa ainda está carregando, tente novamente em instantes.'));
        return;
      }
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result?.routes[0]?.legs[0]?.distance) {
            resolve(result.routes[0].legs[0].distance.value / 1000);
          } else {
            reject(new Error('Não foi possível calcular a rota entre esses endereços.'));
          }
        },
      );
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!origin || !destination) {
      setError('Informe o ponto de partida e o destino.');
      return;
    }
    if (!selectedVehicle) {
      setError('Selecione um veículo.');
      return;
    }
    if (isElectricOnly) {
      setError('Este veículo é 100% elétrico — o cálculo por litro não se aplica a ele ainda.');
      return;
    }

    setIsCalculating(true);
    try {
      const distanceKm = await getRouteDistanceKm();
      const response = await FuelCalculateService.calculate({
        vehicle: selectedVehicle.id,
        distanceKm,
        gasolinePrice: gasolinePrice ? Number(gasolinePrice) : undefined,
        ethanolPrice: ethanolPrice ? Number(ethanolPrice) : undefined,
        dieselPrice: dieselPrice ? Number(dieselPrice) : undefined,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular a rota.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white/90 backdrop-blur-lg rounded-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.1)] overflow-hidden overflow-y-auto">

      {/* Barra de arraste visual - Apenas Mobile */}
      <div
        className="md:hidden w-full flex justify-center py-4 cursor-grab active:cursor-grabbing"
        id="drag-bar"
        onClick={onToggle}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-6 md:p-8 pt-0 md:pt-8"
      >
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800">Para onde vamos?</h1>
          <p className="text-gray-600 text-sm">Calcule o custo da sua viagem em segundos.</p>
        </div>

        <input
          type="text"
          placeholder="Ponto de partida"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />

        <input
          type="text"
          placeholder="Destino final"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />

        <VehicleSelect
          onSelect={(vehicle) => setSelectedVehicle(vehicle.id ? vehicle : null)}
        />

        {isElectricOnly && (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Este veículo é 100% elétrico — ainda não calculamos autonomia por litro para ele.
          </p>
        )}

        {selectedVehicle && !isElectricOnly && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-700">
              Preço do combustível (R$/litro) — opcional, só pra ver o custo estimado
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {acceptsGasoline && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Gasolina"
                  value={gasolinePrice}
                  onChange={(e) => setGasolinePrice(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                />
              )}
              {acceptsEthanol && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Etanol"
                  value={ethanolPrice}
                  onChange={(e) => setEthanolPrice(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                />
              )}
              {acceptsDiesel && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Diesel"
                  value={dieselPrice}
                  onChange={(e) => setDieselPrice(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                />
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isCalculating}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4 shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isCalculating ? 'Calculando...' : 'Calcular Rota'}
        </button>

        {result && (
          <div className="mt-2 flex flex-col gap-2 border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
              Distância estimada: <strong>{result.distanceKm.toFixed(1)} km</strong>
            </p>
            {result.options.map((option) => (
              <div
                key={option.fuel}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-800">{FUEL_LABELS[option.fuel]}</p>
                  <p className="text-xs text-gray-500">
                    {option.litersNeeded} L ({option.consumptionKmL} km/l)
                  </p>
                </div>
                {option.totalCost != null ? (
                  <p className="text-lg font-bold text-blue-600">
                    R$ {option.totalCost.toFixed(2)}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">informe o preço</p>
                )}
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
