'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Place, Transport, CATEGORY_CONFIG, TRANSPORT_CONFIG } from '@/lib/types'

declare global {
  interface Window {
    naver: any
  }
}

interface Props {
  places: Place[]
  transports: Transport[]
  selectedId: number | null
  onMapClick?: (lat: number, lng: number) => void
  onMarkerClick?: (place: Place) => void
}

export default function NaverMap({ places, transports, selectedId, onMarkerClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markers = useRef<Map<number, any>>(new Map())
  const polylines = useRef<any[]>([])

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.naver) return
    mapInstance.current = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(37.5665, 126.9780),
      zoom: 13,
      mapDataControl: false,
      scaleControl: false,
    })
  }, [])

  useEffect(() => {
    if (window.naver?.maps) {
      initMap()
      return
    }
    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}`
    script.async = true
    script.onload = initMap
    document.head.appendChild(script)
  }, [initMap])

  useEffect(() => {
    if (!mapInstance.current || !window.naver) return

    polylines.current.forEach(p => p.setMap(null))
    polylines.current = []

    markers.current.forEach(m => m.setMap(null))
    markers.current.clear()

    const visible = places.filter(p => !p.is_visited)
    const visited = places.filter(p => p.is_visited)

    const addMarker = (place: Place, opacity: number) => {
      const config = CATEGORY_CONFIG[place.category]
      const isSelected = place.id === selectedId
      const size = isSelected ? 36 : 30

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(place.lat, place.lng),
        map: mapInstance.current,
        icon: {
          content: `
            <div style="
              width:${size}px;height:${size}px;border-radius:50%;
              background:${config.markerColor};
              border:2px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
              color:white;font-weight:bold;font-size:${isSelected ? 14 : 12}px;
              opacity:${opacity};
              transition: all 0.2s;
            ">${place.order_index + 1}</div>
          `,
          anchor: new window.naver.maps.Point(size / 2, size / 2),
        },
      })

      window.naver.maps.Event.addListener(marker, 'click', () => {
        onMarkerClick?.(place)
      })

      markers.current.set(place.id, marker)
    }

    visible.forEach(p => addMarker(p, 1))
    visited.forEach(p => addMarker(p, 0.35))

    transports.forEach(t => {
      if (!t.route_path || t.route_path.length === 0) return
      const config = TRANSPORT_CONFIG[t.mode]
      const path = t.route_path.map(([lat, lng]) => new window.naver.maps.LatLng(lat, lng))
      const polyline = new window.naver.maps.Polyline({
        map: mapInstance.current,
        path,
        strokeColor: config.color,
        strokeWeight: 4,
        strokeOpacity: 0.8,
        strokeStyle: t.mode === 'walk' ? 'shortdash' : 'solid',
      })
      polylines.current.push(polyline)
    })

    if (places.length > 0 && !selectedId) {
      const bounds = new window.naver.maps.LatLngBounds()
      places.forEach(p => bounds.extend(new window.naver.maps.LatLng(p.lat, p.lng)))
      mapInstance.current.fitBounds(bounds, { top: 80, right: 20, bottom: 300, left: 20 })
    }

    if (selectedId) {
      const selected = places.find(p => p.id === selectedId)
      if (selected) {
        mapInstance.current.panTo(new window.naver.maps.LatLng(selected.lat, selected.lng))
      }
    }
  }, [places, transports, selectedId, onMarkerClick])

  return <div ref={mapRef} className="w-full h-full" />
}
