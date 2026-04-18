'use client'

import { useState } from 'react'
import { Category, CATEGORY_CONFIG } from '@/lib/types'

interface GeoResult {
  roadAddress: string
  jibunAddress: string
  x: string  // longitude
  y: string  // latitude
}

interface Props {
  onSelect: (place: {
    name: string
    lat: number
    lng: number
    address: string
    category: Category
    visit_time: string
    duration_min: number
    memo: string
  }) => void
  onClose: () => void
}

export default function SearchSheet({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<GeoResult | null>(null)
  const [customName, setCustomName] = useState('')
  const [form, setForm] = useState({ category: 'other' as Category, visit_time: '', duration_min: 60, memo: '' })

  function search() {
    if (!query.trim()) return
    const naver = (window as any).naver
    if (!naver?.maps?.Service) {
      alert('지도가 아직 로딩 중이에요. 잠시 후 다시 시도해주세요.')
      return
    }
    setLoading(true)
    setSearched(true)
    naver.maps.Service.geocode({ query: query.trim() }, (status: any, response: any) => {
      setLoading(false)
      if (status !== naver.maps.Service.Status.OK) {
        setResults([])
        return
      }
      setResults(response.v2.addresses || [])
    })
  }

  function selectResult(r: GeoResult) {
    setSelected(r)
    setCustomName(query.trim())
  }

  function confirm() {
    if (!selected) return
    onSelect({
      name: customName || selected.roadAddress || selected.jibunAddress,
      lat: parseFloat(selected.y),
      lng: parseFloat(selected.x),
      address: selected.roadAddress || selected.jibunAddress,
      ...form,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-pink-100">
          <h2 className="text-lg font-bold text-pink-600">장소 검색</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        {!selected ? (
          <>
            <div className="p-4 flex gap-2">
              <input
                className="flex-1 border border-pink-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="주소 또는 장소명 검색"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                autoFocus
              />
              <button
                onClick={search}
                className="bg-pink-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
              >
                검색
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 pb-4">
              {loading && <p className="text-center text-gray-400 py-8">검색 중...</p>}
              {!loading && searched && results.length === 0 && (
                <p className="text-center text-gray-300 py-8 text-sm">검색 결과가 없어요</p>
              )}
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectResult(r)}
                  className="w-full text-left p-3 rounded-xl hover:bg-pink-50 border border-transparent hover:border-pink-200 mb-2 transition"
                >
                  <p className="font-medium text-sm text-gray-800">{r.roadAddress || r.jibunAddress}</p>
                  {r.roadAddress && r.jibunAddress && (
                    <p className="text-xs text-gray-400 mt-0.5">{r.jibunAddress}</p>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            <div className="bg-pink-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">선택된 주소</p>
              <p className="text-sm text-gray-700">{selected.roadAddress || selected.jibunAddress}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">장소 이름</label>
              <input
                className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="장소 이름 (예: 스타벅스 홍대점)"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setForm(f => ({ ...f, category: key }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      form.category === key ? `${cfg.color} text-white` : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">방문 시간</label>
                <input
                  type="time"
                  className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={form.visit_time}
                  onChange={e => setForm(f => ({ ...f, visit_time: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">머무는 시간 (분)</label>
                <input
                  type="number"
                  className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={form.duration_min}
                  onChange={e => setForm(f => ({ ...f, duration_min: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">메모</label>
              <textarea
                className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
                rows={2}
                placeholder="메모를 입력하세요"
                value={form.memo}
                onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-pink-200 text-pink-500 py-3 rounded-xl text-sm font-medium"
              >
                다시 검색
              </button>
              <button
                onClick={confirm}
                className="flex-1 bg-pink-500 text-white py-3 rounded-xl text-sm font-bold"
              >
                추가하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
