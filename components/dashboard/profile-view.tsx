'use client';

import useSWR from 'swr';
import { User, Phone, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfileView() {
  const { data: user, error, isLoading } = useSWR('/api/auth/me', fetcher);
  console.log(user);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600"></div>
          <p className="text-sm text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || user?.error) { 
     if (user?.status === 401) {
         router.push('/auth/login');
     }
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white rounded-xl border border-red-200 p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to Load Profile</h3>
          <p className="text-sm text-slate-600 mb-4">Please log in again to continue</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };

  const getRoleBadgeColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      'admin': 'bg-purple-100 text-purple-700 ring-purple-200',
      'user': 'bg-blue-100 text-blue-700 ring-blue-200',
      'vendor': 'bg-emerald-100 text-emerald-700 ring-emerald-200',
      'manager': 'bg-amber-100 text-amber-700 ring-amber-200',
    };
    return roleColors[role?.toLowerCase()] || 'bg-slate-100 text-slate-700 ring-slate-200';
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account information and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Gradient Header */}
            <div className="h-32 bg-gradient-to-br from-red-600 via-red-700 to-red-800 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]"></div>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Avatar Section */}
            <div className="px-6 pb-6">
              <div className="relative -mt-16 mb-4">
                <div className="h-32 w-32 mx-auto rounded-full border-4 border-white bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl font-bold text-slate-700 shadow-lg ring-4 ring-slate-50">
                  {getInitials(user?.full_name || '')}
                </div>
                {/* Status Badge */}
                <div className="absolute bottom-1 right-[calc(50%-64px)] translate-x-1/2">
                  <div className="h-7 w-7 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* User Name & Role */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">{user?.full_name || 'User'}</h2>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ring-2 ${getRoleBadgeColor(user?.role || 'User')}`}>
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  {user?.role || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Information Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Personal Information</h3>
                  <p className="text-xs text-slate-500">Your account details</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Full Name */}
              <div className="group">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> 
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={user?.full_name || ''}
                    disabled
                    readOnly
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none cursor-not-allowed transition-colors group-hover:border-slate-300"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="group">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> 
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={user?.phone_number || ''}
                    disabled
                    readOnly
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none cursor-not-allowed transition-colors group-hover:border-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Security Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Account Security</h3>
                  <p className="text-xs text-slate-500">Role and access level</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Shield className="h-6 w-6 text-slate-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">User Role</p>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-lg font-bold text-slate-900">{user?.role || 'User'}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${getRoleBadgeColor(user?.role || 'User')}`}>
                        {user?.role || 'User'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                      <span className="font-medium">
                        {user?.role?.toLowerCase() === 'admin' ? 'Full system access granted' : 'Standard user permissions'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-900 mb-1">Security Notice</h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Keep your account secure by logging out after each session, especially on shared devices. Never share your credentials with others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}