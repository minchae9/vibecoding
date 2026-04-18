'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Place, Category, TransportMode, Transport, CATEGORY_CONFIG, TRANSPORT_CONFIG } from '@/lib/types'

interface Props {
  place: Place
  index: number
  isSelected: boolean
  nextPlace: Place | null
  transport: Transport | null
  onSelect: () => void
  onUpdate: (updated: Partial<Place>) => void
  onDelete: () => void
  onTransportChange: (mode: TransportMode) => void
  onGetDirections: () => void
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

export default function PlaceCard({
  place, index, isSelected, nextPlace, transport,
  onSelect, onUpdate, onDelete, onTransportChange, onGetDirections
}: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: place.name,
    category: place.category as Category,
    visit_time: place.visit_time || '',
    duration_min: place.duration_min ?? ('' as unknown as number),
    memo: place.memo || '',
  })
  const config = CATEGORY_CONFIG[place.category]

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: place.id,
    disabled: editing,
  })

  const distance = nextPlace ? haversineKm(place.lat, place.lng, nextPlace.lat, nextPlace.lng) : null

  function saveEdit() {
    onUpdate(form)
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={place.is_visited ? 'opacity-40' : 'opacity-100'}
    >
      <div
        className={`rounded-2xl border-2 transition-all ${
          isDragging
            ? 'border-pink-300 shadow-xl shadow-pink-100 bg-white scale-[1.02]'
            : isSelected
            ? 'border-pink-400 shadow-md shadow-pink-100'
            : 'border-gray-100'
        } ${place.is_visited ? 'bg-gray-50' : 'bg-white'}`}
        onClick={() => !editing && onSelect()}
      >
        {editing ? (
          <div className="p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <input
              className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 font-medium"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, category: key }))}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    form.category === key ? `${cfg.color} text-white` : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                className="border border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={form.visit_time}
                onChange={e => setForm(f => ({ ...f, visit_time: e.target.value }))}
              />
              <input
                type="number"
                className="border border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="분"
                value={form.duration_min}
                onFocus={e => { if (e.target.value === '0') setForm(f => ({ ...f, duration_min: '' as unknown as number })) }}
                onChange={e => setForm(f => ({ ...f, duration_min: e.target.value === '' ? '' as unknown as number : Number(e.target.value) }))}
              />
            </div>
            <textarea
              className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
              rows={2}
              placeholder="메모"
              value={form.memo}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-xl text-sm">취소</button>
              <button onClick={saveEdit} className="flex-1 bg-pink-500 text-white py-2 rounded-xl text-sm font-bold">저장</button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div
                {...attributes}
                {...listeners}
                className={`touch-none cursor-grab active:cursor-grabbing w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white text-sm font-bold shrink-0 select-none`}
                onClick={e => e.stopPropagation()}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm truncate ${place.is_visited ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {place.name}
                  </p>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${config.color} text-white`}>
                    {config.label}
                  </span>
                </div>
                {place.visit_time && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {place.visit_time}{place.duration_min ? ` · ${place.duration_min}분` : ''}
                  </p>
                )}
                {place.address && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{place.address}</p>
                )}
                {place.memo && (
                  <p className="text-xs text-pink-400 mt-1 italic">{place.memo}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onUpdate({ is_visited: !place.is_visited })}
                  className={`w-6 h-6 rounded-full border-2 transition flex items-center justify-center ${
                    place.is_visited ? 'bg-pink-400 border-pink-400 text-white' : 'border-gray-300'
                  }`}
                >
                  {place.is_visited && <span className="text-xs">✓</span>}
                </button>
                <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-pink-400 transition text-sm">✎</button>
                <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition text-sm">✕</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {nextPlace && (
        <div className="flex items-center gap-2 py-2 px-3" onClick={e => e.stopPropagation()}>
<div className="flex gap-1.5 flex-1 flex-wrap items-center">
            {(['walk', 'car', 'transit'] as TransportMode[]).map(mode => {
              const cfg = TRANSPORT_CONFIG[mode]
              return (
                <button
                  key={mode}
                  onClick={() => onTransportChange(mode)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition ${
                    transport?.mode === mode
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              )
            })}
            {distance !== null && (
              <span className="text-xs text-gray-400">{formatDistance(distance)}</span>
            )}
          </div>
          {transport && (
            <button
              onClick={onGetDirections}
              className="text-xs text-blue-400 underline shrink-0"
            >
              길찾기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
