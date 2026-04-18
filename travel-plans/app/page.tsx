'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Place, Transport, TransportMode, Category } from '@/lib/types'
import SearchSheet from '@/components/SearchSheet'
import PlaceCard from '@/components/PlaceCard'

const NaverMap = dynamic(() => import('@/components/NaverMap'), { ssr: false })

type DrawerState = 'collapsed' | 'half' | 'full'

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [drawerState, setDrawerState] = useState<DrawerState>('half')
  const [initialized, setInitialized] = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    fetch('/api/init').then(() => {
      setInitialized(true)
      loadData()
    })
  }, [])

  async function loadData() {
    const [p, t] = await Promise.all([
      fetch('/api/places').then(r => r.json()),
      fetch('/api/transports').then(r => r.json()),
    ])
    setPlaces(p)
    setTransports(t.map((item: any) => ({
      ...item,
      route_path: item.route_path
        ? (typeof item.route_path === 'string' ? JSON.parse(item.route_path) : item.route_path)
        : null,
    })))
  }

  async function addPlace(data: {
    name: string; lat: number; lng: number; address: string
    category: Category; visit_time: string; duration_min: number; memo: string
  }) {
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, order_index: places.length }),
    })
    const newPlace = await res.json()
    setPlaces(prev => [...prev, newPlace])
    setShowSearch(false)
    setSelectedId(newPlace.id)
    setDrawerState('half')
  }

  async function updatePlace(id: number, updated: Partial<Place>) {
    const place = places.find(p => p.id === id)!
    const merged = { ...place, ...updated }
    const res = await fetch(`/api/places/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    })
    const saved = await res.json()
    setPlaces(prev => prev.map(p => p.id === id ? saved : p))
  }

  async function deletePlace(id: number) {
    await fetch(`/api/places/${id}`, { method: 'DELETE' })
    setPlaces(prev => prev.filter(p => p.id !== id))
    setTransports(prev => prev.filter(t => t.from_place_id !== id && t.to_place_id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  async function setTransportMode(fromId: number, toId: number, mode: TransportMode) {
    const res = await fetch('/api/transports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_place_id: fromId, to_place_id: toId, mode, duration_min: null, route_path: null }),
    })
    const saved = await res.json()
    setTransports(prev => {
      const filtered = prev.filter(t => !(t.from_place_id === fromId && t.to_place_id === toId))
      return [...filtered, saved]
    })
  }

  const getDirections = useCallback(async (from: Place, to: Place, mode: TransportMode) => {
    const start = `${from.lng},${from.lat}`
    const goal = `${to.lng},${to.lat}`
    const res = await fetch(`/api/directions?start=${start}&goal=${goal}&mode=${mode}`)
    const data = await res.json()

    let path: [number, number][] = []
    let durationMin: number | null = null

    if (mode === 'car' && data.route?.trafast?.[0]) {
      const route = data.route.trafast[0]
      durationMin = Math.round(route.summary.duration / 60000)
      path = route.path.map(([lng, lat]: [number, number]) => [lat, lng])
    } else if (mode === 'transit' && data.metaData?.plan?.itineraries?.[0]) {
      const legs = data.metaData.plan.itineraries[0].legs
      durationMin = Math.round(data.metaData.plan.itineraries[0].duration / 60)
      legs.forEach((leg: any) => {
        if (leg.legGeometry?.points) {
          leg.legGeometry.points.split(' ').forEach((pt: string) => {
            const [lat, lng] = pt.split(',').map(Number)
            path.push([lat, lng])
          })
        }
      })
    } else {
      path = [[from.lat, from.lng], [to.lat, to.lng]]
    }

    const saveRes = await fetch('/api/transports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_place_id: from.id, to_place_id: to.id, mode, duration_min: durationMin, route_path: path,
      }),
    })
    const saved = await saveRes.json()
    setTransports(prev => {
      const filtered = prev.filter(t => !(t.from_place_id === from.id && t.to_place_id === to.id))
      return [...filtered, { ...saved, route_path: path }]
    })
  }, [])

  const visitedCount = places.filter(p => p.is_visited).length

  const initialCenter = (() => {
    const unvisited = places
      .filter(p => !p.is_visited && p.visit_time)
      .sort((a, b) => (a.visit_time! > b.visit_time! ? 1 : -1))
    if (unvisited.length > 0) return { lat: unvisited[0].lat, lng: unvisited[0].lng }
    const first = places.find(p => !p.is_visited)
    if (first) return { lat: first.lat, lng: first.lng }
    return null
  })()

  const drawerHeights: Record<DrawerState, string> = {
    collapsed: 'h-24',
    half: 'h-[55vh]',
    full: 'h-[90vh]',
  }

  const addButtonBottom: Record<DrawerState, string> = {
    collapsed: '112px',
    half: 'calc(55vh + 16px)',
    full: 'calc(90vh + 16px)',
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dy = touchStartY.current - e.changedTouches[0].clientY
    if (dy > 40) setDrawerState(prev => prev === 'collapsed' ? 'half' : 'full')
    else if (dy < -40) setDrawerState(prev => prev === 'full' ? 'half' : 'collapsed')
  }

  if (!initialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-pink-50">
        <div className="text-pink-400 text-sm animate-pulse">불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map layer */}
      <div className="absolute inset-0">
        <NaverMap
          places={places}
          transports={transports}
          selectedId={selectedId}
          initialCenter={initialCenter}
          onMarkerClick={p => { setSelectedId(p.id); setDrawerState('half') }}
        />
      </div>

      {/* Floating add button */}
      <button
        onClick={() => { setShowSearch(true) }}
        className="absolute right-4 z-30 w-14 h-14 bg-pink-500 rounded-full shadow-lg shadow-pink-200 flex items-center justify-center text-white text-2xl transition-all duration-300 active:scale-95 hover:bg-pink-600"
        style={{ bottom: addButtonBottom[drawerState] }}
      >
        +
      </button>

      {/* Bottom drawer */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20 flex flex-col transition-all duration-300 ease-out ${drawerHeights[drawerState]}`}
      >
        {/* Handle & header */}
        <div
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0 select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setDrawerState(prev => prev === 'full' ? 'half' : prev === 'half' ? 'collapsed' : 'half')}
        >
          <div className="w-10 h-1 bg-pink-200 rounded-full" />
          <div className="flex items-center justify-between w-full px-5 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <h1 className="text-base font-bold text-gray-800">여행 일정</h1>
            </div>
            {places.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-pink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-400 rounded-full transition-all duration-500"
                    style={{ width: `${(visitedCount / places.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-pink-400 font-medium">{visitedCount}/{places.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Place list */}
        <div className="overflow-y-auto flex-1 px-4 pb-10 space-y-1 pt-1">
          {places.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 gap-1">
              <p className="text-sm text-gray-300">아직 추가된 장소가 없어요</p>
              <p className="text-xs text-pink-300">+ 버튼을 눌러 첫 장소를 추가해보세요</p>
            </div>
          ) : (
            places.map((place, i) => {
              const nextPlace = places[i + 1] ?? null
              const transport = transports.find(
                t => t.from_place_id === place.id && t.to_place_id === nextPlace?.id
              ) ?? null
              return (
                <PlaceCard
                  key={place.id}
                  place={place}
                  index={i}
                  isSelected={selectedId === place.id}
                  nextPlace={nextPlace}
                  transport={transport}
                  onSelect={() => setSelectedId(prev => prev === place.id ? null : place.id)}
                  onUpdate={updated => updatePlace(place.id, updated)}
                  onDelete={() => deletePlace(place.id)}
                  onTransportChange={mode => nextPlace && setTransportMode(place.id, nextPlace.id, mode)}
                  onGetDirections={() => nextPlace && transport && getDirections(place, nextPlace, transport.mode)}
                />
              )
            })
          )}
        </div>
      </div>

      {showSearch && (
        <SearchSheet onSelect={addPlace} onClose={() => setShowSearch(false)} />
      )}
    </div>
  )
}
