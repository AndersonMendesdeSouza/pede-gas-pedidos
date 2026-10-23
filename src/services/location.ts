import type { AddressInput } from "../types";

export interface LocationResult {
  latitude: number;
  longitude: number;
  address: Partial<AddressInput>;
}

export async function locate(): Promise<LocationResult> {
  if (!navigator.geolocation)
    throw new Error(
      "Este navegador não oferece localização. Preencha o endereço manualmente.",
    );
  if (!window.isSecureContext)
    throw new Error(
      "A localização exige HTTPS ou localhost. Preencha o endereço manualmente.",
    );
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) =>
        reject(
          new Error(
            error.code === 1
              ? "Acesso à localização negado. Você pode preencher o endereço manualmente."
              : "Não foi possível encontrar sua localização. Tente novamente ou preencha o endereço.",
          ),
        ),
      { timeout: 15000, maximumAge: 60000 },
    );
  });
  const { latitude, longitude } = position.coords;
  const result: LocationResult = { latitude, longitude, address: {} };
  // O navegador fornece coordenadas. Um serviço configurado converte-as em endereço.
  const endpoint = import.meta.env.VITE_REVERSE_GEOCODING_URL;
  if (!endpoint) return result;
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok)
    throw new Error(
      "Localização encontrada, mas não foi possível consultar o endereço. Preencha os campos manualmente.",
    );
  const data = (await response.json()) as { address?: Record<string, string> };
  const address = data.address ?? {};
  result.address = {
    street: address.road || address.pedestrian || "",
    number: address.house_number || "",
    neighborhood: address.suburb || address.neighbourhood || "",
    city: address.city || address.town || address.village || "",
    state: (address["ISO3166-2-lvl4"] || "").replace("BR-", ""),
    zipCode: address.postcode || "",
    country: address.country || "Brasil",
  };
  return result;
}
