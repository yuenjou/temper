'use client'

import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit() {
        setLoading(true)
        setError('')

        const { error } = isSignUp
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(error.message)
        } else {
            router.push('/dashboard')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="w-full max-w-sm p-8">
                <h1 className="text-3xl font-bold text-white mb-2">Temper</h1>
                <p className="text-zinc-400 mb-8">{isSignUp ? 'Create account' : 'Welcome back'}</p>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg mb-3 outline-none border border-zinc-800 focus:border-zinc-600"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg mb-3 outline-none border border-zinc-800 focus:border-zinc-600"
                />

                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-white text-black font-semibold py-3 rounded-lg mb-4 hover:bg-zinc-200 transition"
                >
                    {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Log In'}
                </button>

                <p className="text-zinc-400 text-sm text-center">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-white underline">
                        {isSignUp ? 'Log in' : 'Sign up'}
                    </button>
                </p>
            </div>
        </div>
    )
}