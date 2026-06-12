'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Meal = {
  id: string
  image_url: string
  detected_items: string[]
  analysis_text: string
  logged_at: string
}

export default function Home() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [uploading, setUploading] = useState<number | null>(null)
  const [selected, setSelected] = useState<Meal | null>(null)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    loadTodaysMeals()
  }, [])

  async function loadTodaysMeals() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('meal_date', today)
      .order('logged_at')
    if (data) setMeals(data)
  }

  async function handleFile(file: File, slot: number) {
    setUploading(slot)
    try {
      const base64 = await fileToBase64(file)
      const analysisRes = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
      })
      const analysis = await analysisRes.json()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ext = file.name.split('.').pop()
      const filePath = `${user.id}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('meals').upload(filePath, file, { contentType: file.type })
      if (uploadError) { console.error('UPLOAD ERROR:', JSON.stringify(uploadError)); return }

      const { data: { publicUrl } } = supabase.storage.from('meals').getPublicUrl(filePath)

      await supabase.from('meals').insert({
        user_id: user.id,
        image_url: publicUrl,
        detected_items: analysis.items || [],
        analysis_text: analysis.summary || '',
      })

      await loadTodaysMeals()
    } finally {
      setUploading(null)
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => resolve((e.target?.result as string).split(',')[1])
      reader.readAsDataURL(file)
    })
  }

  const slots = [0, 1, 2]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-rose-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <div>
              <h1 className="font-bold text-rose-500 text-lg leading-tight">Nourish</h1>
              <p className="text-xs text-gray-400">Daily meal tracker</p>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/history" className="text-sm text-gray-500 hover:text-rose-400 transition-colors">📅 History</Link>
            {!user
              ? <Link href="/login" className="text-sm bg-rose-400 text-white px-3 py-1.5 rounded-full hover:bg-rose-500 transition-colors">Sign in</Link>
              : <span className="text-xs text-gray-400">{user.email}</span>
            }
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Date + progress */}
        <div className="mb-8 text-center">
          <p className="text-gray-400 text-sm mb-1">{today}</p>
          <h2 className="text-2xl font-bold text-gray-700">Today&apos;s Meals</h2>
          <div className="flex justify-center gap-2 mt-3">
            {slots.map(i => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < meals.length ? 'bg-rose-400' : 'bg-rose-100'}`} />
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-2">{meals.length}/3 meals logged</p>
        </div>

        {/* Upload slots + sidebar layout */}
        <div className="flex gap-6">
          {/* Upload cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {slots.map(i => {
              const meal = meals[i]
              return (
                <div key={i} className="relative">
                  {meal ? (
                    <button
                      onClick={() => setSelected(meal)}
                      className="w-full aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border-2 border-rose-100 group relative"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={meal.image_url} alt="meal" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-white text-xs">{meal.detected_items.slice(0, 2).join(', ')}{meal.detected_items.length > 2 ? '…' : ''}</p>
                      </div>
                      <div className="absolute top-2 right-2 bg-rose-400 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">{i + 1}</div>
                    </button>
                  ) : (
                    <button
                      onClick={() => inputRefs[i].current?.click()}
                      disabled={uploading !== null}
                      className="w-full aspect-square rounded-2xl border-2 border-dashed border-rose-200 bg-white/60 hover:bg-rose-50 hover:border-rose-300 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {uploading === i ? (
                        <>
                          <div className="w-8 h-8 border-3 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
                          <p className="text-xs text-rose-400">Analysing…</p>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl">📷</span>
                          <p className="text-sm font-medium text-gray-400">Meal {i + 1}</p>
                          <p className="text-xs text-gray-300">tap to upload</p>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    ref={inputRefs[i]}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], i)}
                  />
                </div>
              )
            })}
          </div>

          {/* Sidebar — selected meal details */}
          {selected && (
            <div className="w-64 bg-white rounded-2xl shadow-sm border border-rose-100 p-4 h-fit sticky top-20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 text-sm">Analysis</h3>
                <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.image_url} alt="meal" className="w-full h-32 object-cover rounded-xl mb-3" />
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{selected.analysis_text}</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.detected_items.map(item => (
                  <span key={item} className="bg-rose-50 text-rose-500 text-xs px-2 py-1 rounded-full border border-rose-100">{item}</span>
                ))}
              </div>
              <p className="text-xs text-gray-300 mt-3">{new Date(selected.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}
        </div>

        {/* Meal list below */}
        {meals.length > 0 && !selected && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Tap a meal to see details</h3>
            <div className="space-y-2">
              {meals.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-rose-50 hover:border-rose-200 transition-colors text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600">Meal {i + 1}</p>
                    <p className="text-xs text-gray-400 truncate">{m.detected_items.join(', ')}</p>
                  </div>
                  <span className="text-rose-300">›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
