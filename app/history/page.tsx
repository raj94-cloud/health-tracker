'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Meal = {
  id: string
  image_url: string
  detected_items: string[]
  analysis_text: string
  logged_at: string
  meal_date: string
}

export default function History() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [selected, setSelected] = useState<string | null>(null) // selected date
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    supabase.from('meals').select('*').order('logged_at', { ascending: false }).then(({ data }) => {
      if (data) setMeals(data)
    })
  }, [])

  const mealsByDate = meals.reduce((acc, m) => {
    acc[m.meal_date] = acc[m.meal_date] || []
    acc[m.meal_date].push(m)
    return acc
  }, {} as Record<string, Meal[]>)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const selectedMeals = selected ? (mealsByDate[selected] || []) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur border-b border-rose-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <h1 className="font-bold text-rose-500 text-lg">Nourish</h1>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-rose-400 transition-colors">🏠 Today</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">Meal History</h2>

        <div className="flex gap-6">
          {/* Calendar */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-rose-100 p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1))}
                className="text-rose-300 hover:text-rose-500 text-xl px-2"
              >‹</button>
              <h3 className="font-semibold text-gray-600">{monthName}</h3>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1))}
                className="text-rose-300 hover:text-rose-500 text-xl px-2"
              >›</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const count = mealsByDate[dateStr]?.length || 0
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                const isSelected = dateStr === selected
                return (
                  <button
                    key={day}
                    onClick={() => setSelected(isSelected ? null : dateStr)}
                    className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center transition-all relative
                      ${isSelected ? 'bg-rose-400 text-white' : isToday ? 'bg-rose-50 text-rose-500 font-bold' : 'hover:bg-rose-50 text-gray-600'}
                    `}
                  >
                    {day}
                    {count > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                          <div key={j} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-rose-300'}`} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Day detail */}
          {selected && (
            <div className="w-64">
              <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4">
                <h3 className="font-semibold text-gray-600 text-sm mb-3">
                  {new Date(selected + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                {selectedMeals.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No meals logged</p>
                ) : (
                  <div className="space-y-3">
                    {selectedMeals.map((m, i) => (
                      <div key={m.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.image_url} alt="" className="w-full h-28 object-cover rounded-xl mb-2" />
                        <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">{m.analysis_text}</p>
                        <div className="flex flex-wrap gap-1">
                          {m.detected_items.map(item => (
                            <span key={item} className="bg-rose-50 text-rose-400 text-xs px-2 py-0.5 rounded-full border border-rose-100">{item}</span>
                          ))}
                        </div>
                        {i < selectedMeals.length - 1 && <hr className="mt-3 border-rose-50" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent streak */}
        <div className="mt-6 bg-white rounded-2xl border border-rose-100 p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {Object.entries(mealsByDate).slice(0, 7).map(([date, ms]) => (
              <button
                key={date}
                onClick={() => setSelected(date)}
                className="w-full flex items-center gap-3 hover:bg-rose-50 rounded-xl p-2 transition-colors text-left"
              >
                <div className="flex gap-1">
                  {ms.slice(0, 3).map(m => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={m.id} src={m.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">{ms.length} meal{ms.length !== 1 ? 's' : ''} logged</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
