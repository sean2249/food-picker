// Server-side wrappers around Google Places API (New).
// The API key (GOOGLE_MAPS_API_KEY) must never reach the client — these are
// only ever called from /api/places/* route handlers.

const PLACES_BASE = 'https://places.googleapis.com/v1'

export interface PlaceSuggestion {
  placeId: string
  name: string       // structuredFormat.mainText — the place name
  address: string    // structuredFormat.secondaryText — area / address hint
}

export interface PlaceDetail {
  placeId: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  googleMapsUrl: string | null
  locality: string | null   // 縣市/區, derived from addressComponents — label for 其他地區
}

export function isPlacesConfigured(): boolean {
  return !!process.env.GOOGLE_MAPS_API_KEY
}

function apiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY not configured')
  return key
}

interface AutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId?: string
      structuredFormat?: {
        mainText?: { text?: string }
        secondaryText?: { text?: string }
      }
      text?: { text?: string }
    }
  }[]
}

export async function autocompletePlaces(input: string): Promise<PlaceSuggestion[]> {
  const trimmed = input.trim()
  if (!trimmed) return []

  const res = await fetch(`${PLACES_BASE}/places:autocomplete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
    },
    body: JSON.stringify({
      input: trimmed,
      languageCode: 'zh-TW',
      regionCode: 'TW',
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Places autocomplete failed (${res.status}): ${detail.slice(0, 200)}`)
  }

  const data = (await res.json()) as AutocompleteResponse
  return (data.suggestions ?? [])
    .map(s => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p?.placeId)
    .map(p => ({
      placeId: p.placeId as string,
      name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
      address: p.structuredFormat?.secondaryText?.text ?? '',
    }))
}

interface AddressComponent {
  longText?: string
  shortText?: string
  types?: string[]
}

interface PlaceDetailsResponse {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  location?: { latitude?: number; longitude?: number }
  googleMapsUri?: string
  addressComponents?: AddressComponent[]
}

// Pick a short, human-readable area label (縣市, falling back to 區/鄉鎮) for the
// 其他地區 location tag. Returns null if nothing usable is present.
function deriveLocality(components: AddressComponent[] | undefined): string | null {
  if (!components?.length) return null
  const byType = (type: string) =>
    components.find(c => c.types?.includes(type))?.longText ?? null
  return (
    byType('administrative_area_level_1') ??
    byType('administrative_area_level_2') ??
    byType('locality') ??
    null
  )
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetail> {
  const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask':
        'id,displayName,formattedAddress,location,googleMapsUri,addressComponents',
    },
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Places details failed (${res.status}): ${detail.slice(0, 200)}`)
  }

  const data = (await res.json()) as PlaceDetailsResponse
  return {
    placeId: data.id ?? placeId,
    name: data.displayName?.text ?? '',
    address: data.formattedAddress ?? null,
    lat: data.location?.latitude ?? null,
    lng: data.location?.longitude ?? null,
    googleMapsUrl: data.googleMapsUri ?? null,
    locality: deriveLocality(data.addressComponents),
  }
}
