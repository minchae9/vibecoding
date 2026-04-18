export type Category = 'cafe' | 'restaurant' | 'attraction' | 'shopping' | 'transport' | 'other'
export type TransportMode = 'walk' | 'car' | 'transit'

export interface Place {
  id: number
  name: string
  category: Category
  lat: number
  lng: number
  visit_time: string | null
  duration_min: number | null
  memo: string | null
  order_index: number
  is_visited: boolean
  address: string | null
}

export interface Transport {
  id: number
  from_place_id: number
  to_place_id: number
  mode: TransportMode
  duration_min: number | null
  route_path: [number, number][] | null
}

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; markerColor: string }> = {
  cafe: { label: '카페', color: 'bg-amber-500', markerColor: '#F59E0B' },
  restaurant: { label: '식당', color: 'bg-rose-500', markerColor: '#F43F5E' },
  attraction: { label: '관광지', color: 'bg-blue-500', markerColor: '#3B82F6' },
  shopping: { label: '쇼핑', color: 'bg-purple-500', markerColor: '#A855F7' },
  transport: { label: '교통', color: 'bg-green-500', markerColor: '#22C55E' },
  other: { label: '기타', color: 'bg-gray-400', markerColor: '#9CA3AF' },
}

export const TRANSPORT_CONFIG: Record<TransportMode, { label: string; icon: string; color: string }> = {
  walk: { label: '도보', icon: '🚶', color: '#10B981' },
  car: { label: '자동차', icon: '🚗', color: '#3B82F6' },
  transit: { label: '대중교통', icon: '🚌', color: '#8B5CF6' },
}
