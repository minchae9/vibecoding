'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Place, Transport, TransportMode, Category } from '@/lib/types'
import SearchSheet from '@/components/SearchSheet'
import PlaceCard from '@/components/PlaceCard'

const NaverMap = dynamic(() => import('@/components/NaverMap'), { ssr: false })

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [initialized, setInitialized] = useState(false)

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

  const getDirections = useCallback((from: Place, to: Place, mode: TransportMode) => {
    const modeMap: Record<TransportMode, string> = { walk: 'walk', car: 'car', transit: 'public' }
    const naverMode = modeMap[mode]

    const appUrl = `nmap://route/${naverMode}?slat=${from.lat}&slng=${from.lng}&sname=${encodeURIComponent(from.name)}&dlat=${to.lat}&dlng=${to.lng}&dname=${encodeURIComponent(to.name)}&appname=com.travel.plans`
    const webUrl = `https://map.naver.com/v5/directions/${from.lng},${from.lat},${encodeURIComponent(from.name)},-1/${to.lng},${to.lat},${encodeURIComponent(to.name)},-1/${naverMode}`

    window.location.href = appUrl
    setTimeout(() => {
      if (!document.hidden) window.open(webUrl, '_blank')
    }, 2000)
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

  if (!initialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-pink-50">
        <div className="text-pink-400 text-sm animate-pulse">불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-pink-50 overflow-hidden">
      {/* Map overlay */}
      {showMap && (
        <div className="fixed inset-0 z-50">
          <NaverMap
            places={places}
            transports={transports}
            selectedId={selectedId}
            initialCenter={initialCenter}
            onMarkerClick={p => setSelectedId(p.id)}
          />
          <button
            onClick={() => setShowMap(false)}
            className="absolute top-4 right-4 z-10 bg-white rounded-full shadow-lg px-4 py-2 text-sm font-semibold text-gray-700 active:scale-95 transition"
          >
            닫기
          </button>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-12 pb-3 bg-white border-b border-pink-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <h1 className="text-base font-bold text-gray-800">여행 일정</h1>
        </div>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setShowMap(true)}
            className="text-xs bg-pink-50 border border-pink-200 text-pink-500 font-medium px-3 py-1.5 rounded-full active:scale-95 transition"
          >
            지도
          </button>
        </div>
      </div>

      {/* Place list */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28 space-y-1">
        {places.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-1">
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

      {/* Floating add button */}
      <button
        onClick={() => setShowSearch(true)}
        className="fixed bottom-6 right-4 z-30 w-14 h-14 bg-pink-500 rounded-full shadow-lg shadow-pink-200 flex items-center justify-center text-white text-2xl active:scale-95 hover:bg-pink-600 transition"
      >
        +
      </button>

      {showSearch && (
        <SearchSheet onSelect={addPlace} onClose={() => setShowSearch(false)} />
      )}
    </div>
  )
}
