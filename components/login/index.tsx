"use client" 
import React, { useState } from 'react';
import { Eye, EyeOff, Phone, User, Lock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LoginView = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        phoneNumber: '',
        password: '',
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        console.log(formData);
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, rememberMe }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login gagal');
            }

            router.push('/dashboard/master-data'); 
            router.refresh(); 
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
            
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
                    <div className="flex flex-col items-center justify-center mb-5">
                        <div className="flex items-center gap-4">
                            <div className="relative w-23 h-23">
                                <img 
                                    src="/images/telkom-logo.png" 
                                    alt="Telkom Indonesia" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <span className="text-4xl font-bold tracking-tight text-[#231F20]">
                                CAPEX<span className="text-[#EE2E24]">MGT</span>
                            </span>
                        </div>
                    </div>

                    <div className="text-center mb-5">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-sm text-gray-500">
                            Sign in to continue
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="08xxxxxxxxxx"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400"
                                    required
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                                <input 
                                    id="remember-me" 
                                    name="rememberMe" 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" 
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-gray-700">Remember me</label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-red-600 text-white font-semibold py-3.5 rounded-xl hover:bg-red-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-6 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-600 mt-8">
                        Don't have an account?{' '}
                        <a href="/auth/register" className="text-red-600 font-semibold hover:text-red-700 transition-colors">
                            Sign up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
