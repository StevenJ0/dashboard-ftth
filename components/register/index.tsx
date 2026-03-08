"use client";

import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Phone, User, Lock, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import OTPVerifyForm from '../auth/OTPVerifyForm';
import { Modal } from '../ui/Modal';

// Telkom Indonesia Brand Colors
const TELKOM_COLORS = {
  red: "#EE2E24",
  dark: "#231F20",
  blue: "#0050AE",
  white: "#FFFFFF",
  gray: "#E6E7E8",
};

// Password validation rules
const PASSWORD_RULES = [
  { id: 'minLength', label: 'Minimal 8 karakter', regex: /.{8,}/ },
  { id: 'uppercase', label: 'Minimal 1 huruf besar (A-Z)', regex: /[A-Z]/ },
  { id: 'lowercase', label: 'Minimal 1 huruf kecil (a-z)', regex: /[a-z]/ },
  { id: 'number', label: 'Minimal 1 angka (0-9)', regex: /[0-9]/ },
  { id: 'special', label: 'Minimal 1 karakter spesial (!@#$%^&*)', regex: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/ },
];

const RegisterView = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  
  // Custom Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [onModalCloseAction, setOnModalCloseAction] = useState<(() => void) | null>(null);

  const [error, setError] = useState('');

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info', onCloseAction?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    if (onCloseAction) {
      setOnModalCloseAction(() => onCloseAction);
    } else {
      setOnModalCloseAction(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (onModalCloseAction) onModalCloseAction();
  };

  // Password validation state
  const passwordValidation = useMemo(() => {
    const results = PASSWORD_RULES.map(rule => ({
      ...rule,
      isValid: rule.regex.test(formData.password)
    }));
    
    const passedRules = results.filter(r => r.isValid).length;
    const totalRules = PASSWORD_RULES.length;
    
    let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
    let strengthColor = '#EF4444'; // red
    let strengthLabel = 'Lemah';
    
    if (passedRules >= 5) {
      strength = 'very-strong';
      strengthColor = '#10B981'; // green
      strengthLabel = 'Sangat Kuat';
    } else if (passedRules >= 4) {
      strength = 'strong';
      strengthColor = '#22C55E'; // light green
      strengthLabel = 'Kuat';
    } else if (passedRules >= 3) {
      strength = 'medium';
      strengthColor = '#F59E0B'; // yellow/orange
      strengthLabel = 'Sedang';
    }
    
    return {
      rules: results,
      passedRules,
      totalRules,
      strength,
      strengthColor,
      strengthLabel,
      isValid: passedRules === totalRules
    };
  }, [formData.password]);
  
  // OTP State
  const [showOtp, setShowOtp] = useState(false);
  const [registeredPhone, setRegisteredPhone] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate password strength
    if (!passwordValidation.isValid) {
      setError('Password tidak memenuhi persyaratan keamanan');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan Konfirmasi Password tidak sama');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan');
      }

      // Success
      if (data.otpSent) {
        setRegisteredPhone(data.phoneNumber);
        setShowOtp(true);
      } else {
        showModal(
          'Registrasi Berhasil',
          `Registrasi berhasil! Silakan buka Telegram dan chat bot @ProjectTomps_bot dengan format: /verify ${data.phoneNumber} untuk mengaktifkan akun.`,
          'success',
          () => router.push('/auth/login')
        );
      }
    } catch (err: any) {
      setError(err.message);
      showModal('Gagal', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSuccess = () => {
    showModal(
      'Verifikasi Berhasil',
      'Verifikasi berhasil! Akun Anda telah aktif. Silakan login.',
      'success',
      () => router.push('/auth/login')
    );
  };

  if (showOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <OTPVerifyForm 
          phoneNumber={registeredPhone} 
          onSuccess={handleOtpSuccess}
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, ${TELKOM_COLORS.white} 0%, #F8F9FA 50%, ${TELKOM_COLORS.gray} 100%)` 
      }}
    >
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div 
          className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8"
          style={{ border: `1px solid ${TELKOM_COLORS.gray}` }}
        >
          {/* Logo/Icon */}
          {/* Logo/Icon */}
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

          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold mb-2" style={{ color: TELKOM_COLORS.dark }}>
              Create Account
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Fill in your details to get started
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="mb-4 p-3 rounded-lg text-sm text-center"
              style={{ 
                backgroundColor: "rgba(238, 46, 36, 0.1)", 
                border: `1px solid ${TELKOM_COLORS.red}`,
                color: TELKOM_COLORS.red 
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Input */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2" style={{ color: TELKOM_COLORS.dark }}>
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9CA3AF" }} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl transition-all"
                  style={{ 
                    backgroundColor: "#F9FAFB",
                    border: `1px solid ${TELKOM_COLORS.gray}`,
                    color: TELKOM_COLORS.dark,
                  }}
                />
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2" style={{ color: TELKOM_COLORS.dark }}>
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9CA3AF" }} />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl transition-all"
                  style={{ 
                    backgroundColor: "#F9FAFB",
                    border: `1px solid ${TELKOM_COLORS.gray}`,
                    color: TELKOM_COLORS.dark,
                  }}
                />
              </div>
              <p className="text-xs mt-1.5 ml-1" style={{ color: "#6B7280" }}>
                We'll send OTP to this number
              </p>
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2" style={{ color: TELKOM_COLORS.dark }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9CA3AF" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl transition-all"
                  style={{ 
                    backgroundColor: "#F9FAFB",
                    border: `1px solid ${TELKOM_COLORS.gray}`,
                    color: TELKOM_COLORS.dark,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#9CA3AF" }}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  {/* Strength Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300 rounded-full"
                        style={{ 
                          width: `${(passwordValidation.passedRules / passwordValidation.totalRules) * 100}%`,
                          backgroundColor: passwordValidation.strengthColor 
                        }}
                      />
                    </div>
                    <span 
                      className="text-xs font-medium min-w-[80px] text-right"
                      style={{ color: passwordValidation.strengthColor }}
                    >
                      {passwordValidation.strengthLabel}
                    </span>
                  </div>

                  {/* Password Requirements List */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-medium text-gray-600 mb-2">Persyaratan Password:</p>
                    {passwordValidation.rules.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-2">
                        {rule.isValid ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-400" />
                        )}
                        <span 
                          className={`text-xs ${rule.isValid ? 'text-green-600' : 'text-gray-500'}`}
                        >
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2" style={{ color: TELKOM_COLORS.dark }}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9CA3AF" }} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl transition-all"
                  style={{ 
                    backgroundColor: "#F9FAFB",
                    border: `1px solid ${TELKOM_COLORS.gray}`,
                    color: TELKOM_COLORS.dark,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#9CA3AF" }}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-6"
              style={{ backgroundColor: TELKOM_COLORS.red }}
            >
              Sign Up
            </button>


          </form>

          {/* Footer */}
          <p className="text-center text-sm mt-8" style={{ color: "#6B7280" }}>
            Already have an account?{' '}
            <a 
              href="/auth/login" 
              className="font-semibold transition-colors"
              style={{ color: TELKOM_COLORS.red }}
            >
              Sign in
            </a>
          </p>
        </div>

        {/* Terms */}
        <p className="text-center text-xs mt-6 px-4" style={{ color: "#6B7280" }}>
          By signing up, you agree to our{' '}
          <a href="#" className="hover:underline" style={{ color: TELKOM_COLORS.dark }}>Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="hover:underline" style={{ color: TELKOM_COLORS.dark }}>Privacy Policy</a>
        </p>
      </div>
      <Modal 
        isOpen={isModalOpen}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={closeModal}
      />
    </div>
  );
};

export default RegisterView;
