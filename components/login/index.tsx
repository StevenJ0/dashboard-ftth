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

    // Reset Password State
    const [showResetModal, setShowResetModal] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false); // Toggle for reset password logic
    const [resetStep, setResetStep] = useState(0); // 0: Input Phone, 1: Verify OTP, 2: New Password, 3: Success
    const [resetData, setResetData] = useState({
        phoneNumber: '',
        otpCode: '',
        newPassword: '',
        confirmPassword: '',
        resetToken: ''
    });
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');

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

    // --- RESET PASSWORD LOGIC ---
    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);
        setResetError('');
        try {
            const res = await fetch('/api/auth/reset/request', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ phoneNumber: resetData.phoneNumber })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setResetStep(1);
        } catch (err: any) {
            setResetError(err.message);
        } finally { setResetLoading(false); }
    };

    const handleResetVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);
        setResetError('');
        try {
            const res = await fetch('/api/auth/reset/verify', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ phoneNumber: resetData.phoneNumber, otpCode: resetData.otpCode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setResetData({ ...resetData, resetToken: data.resetToken });
            setResetStep(2);
        } catch (err: any) {
            setResetError(err.message);
        } finally { setResetLoading(false); }
    };

    const handleResetConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (resetData.newPassword !== resetData.confirmPassword) {
            setResetError('Password dan Konfirmasi Password tidak sama.');
            return;
        }

        setResetLoading(true);
        setResetError('');
        try {
            const res = await fetch('/api/auth/reset/confirm', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ resetToken: resetData.resetToken, newPassword: resetData.newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setResetStep(3); // Success
            setTimeout(() => {
                setShowResetModal(false);
                setResetStep(0);
                setResetData({ phoneNumber: '', otpCode: '', newPassword: '', confirmPassword: '', resetToken: '' });
                setShowResetPassword(false);
            }, 2000);
        } catch (err: any) {
            setResetError(err.message);
        } finally { setResetLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
            
            {/* --- RESET PASSWORD MODAL --- */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                        <button 
                            onClick={() => setShowResetModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Reset Password</h2>
                        
                        {resetError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-200">
                                {resetError}
                            </div>
                        )}

                        {resetStep === 0 && (
                            <form onSubmit={handleResetRequest} className="space-y-4">
                                <p className="text-gray-600 text-sm mb-2 text-center">Masukkan nomor HP Anda untuk menerima kode OTP reset password.</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
                                    <input 
                                        type="tel" 
                                        value={resetData.phoneNumber}
                                        onChange={(e) => setResetData({...resetData, phoneNumber: e.target.value})}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-900"
                                        placeholder="08..."
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={resetLoading} className="w-full bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 disabled:opacity-70 transition-colors">
                                    {resetLoading ? 'Mengirim...' : 'Kirim Kode OTP'}
                                </button>
                            </form>
                        )}

                        {resetStep === 1 && (
                            <form onSubmit={handleResetVerify} className="space-y-4">
                                <p className="text-gray-600 text-sm mb-2 text-center">Masukkan kode OTP yang dikirim ke WhatsApp Anda.</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode OTP</label>
                                    <input 
                                        type="text" 
                                        value={resetData.otpCode}
                                        onChange={(e) => setResetData({...resetData, otpCode: e.target.value})}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-mono text-center tracking-widest text-lg"
                                        placeholder="XXXXXX"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={resetLoading} className="w-full bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 disabled:opacity-70 transition-colors">
                                    {resetLoading ? 'Memverifikasi...' : 'Verifikasi OTP'}
                                </button>
                            </form>
                        )}

                        {resetStep === 2 && (
                            <form onSubmit={handleResetConfirm} className="space-y-4">
                                <p className="text-gray-600 text-sm mb-2 text-center">Silakan buat password baru Anda.</p>
                                
                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                                    <div className="relative">
                                        <input 
                                            type={showResetPassword ? "text" : "password"} 
                                            value={resetData.newPassword}
                                            onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-900 pr-12"
                                            placeholder="******"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowResetPassword(!showResetPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showResetPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showResetPassword ? "text" : "password"} 
                                            value={resetData.confirmPassword}
                                            onChange={(e) => setResetData({...resetData, confirmPassword: e.target.value})}
                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 pr-12"
                                            placeholder="******"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <button type="submit" disabled={resetLoading} className="w-full bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 disabled:opacity-70 transition-colors">
                                    {resetLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                                </button>
                            </form>
                        )}

                        {resetStep === 3 && (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Password Berhasil Diubah!</h3>
                                <p className="text-gray-600 text-sm">Anda dapat login sekarang menggunakan password baru.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}


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
