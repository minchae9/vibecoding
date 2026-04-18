'use client'

import { useState } from 'react'
import { Category, CATEGORY_CONFIG } from '@/lib/types'

interface SearchResult {
  title: string
  address: string
  roadAddress: string
  mapx: string
  mapy: string
  category: string
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

function guessCategory(category: string): Category {
  if (category.includes('카페') || category.includes('커피')) return 'cafe'
  if (category.includes('음식') || category.includes('식당') || category.includes('맛집')) return 'restaurant'
  if (category.includes('관광') || category.includes('문화') || category.includes('공원')) return 'attraction'
  if (category.includes('쇼핑') || category.includes('마트') || category.includes('백화점')) return 'shopping'
  if (category.includes('교통') || category.includes('역') || category.includes('버스')) return 'transport'
  return 'other'
}

export default function SearchSheet({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [form, setForm] = useState({ category: 'cafe' as Category, visit_time: '', duration_min: 60, memo: '' })

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`)
    const data = await res.json()
    setResults(data.items || [])
    setLoading(false)
  }

  function selectResult(r: SearchResult) {
    setSelected(r)
    setForm(f => ({ ...f, category: guessCategory(r.category) }))
  }

  function confirm() {
    if (!selected) return
    const lng = parseInt(selected.mapx) / 1e7
    const lat = parseInt(selected.mapy) / 1e7
    onSelect({
      name: selected.title.replace(/<[^>]+>/g, ''),
      lat,
      lng,
      address: selected.roadAddress || selected.address,
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
                className="flex-1 border border-pink-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="장소명 검색 (예: 성수동 카페)"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
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
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectResult(r)}
                  className="w-full text-left p-3 rounded-xl hover:bg-pink-50 border border-transparent hover:border-pink-200 mb-2 transition"
                >
                  <p className="font-medium text-sm" dangerouslySetInnerHTML={{ __html: r.title }} />
                  <p className="text-xs text-gray-400 mt-0.5">{r.roadAddress || r.address}</p>
                  <p className="text-xs text-pink-400 mt-0.5">{r.category}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            <div className="bg-pink-50 rounded-xl p-3">
              <p className="font-bold text-sm" dangerouslySetInnerHTML={{ __html: selected.title }} />
              <p className="text-xs text-gray-500 mt-1">{selected.roadAddress || selected.address}</p>
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
                  className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={form.visit_time}
                  onChange={e => setForm(f => ({ ...f, visit_time: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">머무는 시간 (분)</label>
                <input
                  type="number"
                  className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={form.duration_min}
                  onChange={e => setForm(f => ({ ...f, duration_min: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">메모</label>
              <textarea
                className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
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
