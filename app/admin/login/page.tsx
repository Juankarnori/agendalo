'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Calendar } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o contraseña incorrectos'); setLoading(false) }
    else window.location.href = '/admin'
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Panel Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Agendalo</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-2.5 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-2.5 outline-none transition" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  )
}
