// app/dashboard/loading.tsx
// Next.js secara otomatis menampilkan file ini SEGERA setelah router.push('/dashboard')
// dipanggil — TANPA menunggu getDashboardData() selesai.
// Ini yang menghilangkan freeze di halaman Login.

const TELKOM_RED = "#EE2E24";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Topbar Skeleton ── */}
      <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
          <div className="w-36 h-4 rounded-full bg-gray-200 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-24 h-4 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar Skeleton ── */}
        <div className="w-56 bg-white border-r border-gray-200 p-4 flex flex-col gap-2 shadow-sm shrink-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-lg bg-gray-100 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>

        {/* ── Main Content Area ── */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* Page Header Skeleton */}
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-40 h-7 rounded-lg bg-gray-200 animate-pulse" />
              <div className="w-64 h-4 rounded-full bg-gray-200 animate-pulse" />
            </div>
            <div className="w-36 h-9 rounded-lg bg-gray-200 animate-pulse" />
          </div>

          {/* Tab Bar Skeleton */}
          <div className="flex gap-2 mb-6 pb-1 border-b border-gray-200">
            <div className="w-32 h-8 rounded-t-lg bg-gray-200 animate-pulse" />
            <div className="w-28 h-8 rounded-t-lg bg-gray-100 animate-pulse" />
          </div>

          {/* KPI Scorecard Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { color: "#3B82F6" },   // blue  → PLAN
              { color: "#F59E0B" },   // amber → ON GOING
              { color: "#10B981" },   // green → GO LIVE
            ].map(({ color }, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="px-4 py-2.5" style={{ backgroundColor: color }}>
                  <div className="w-20 h-3.5 rounded-full bg-white/30 animate-pulse" />
                </div>
                <div className="p-4 flex flex-col items-center gap-3">
                  <div className="w-16 h-10 rounded-lg bg-gray-100 animate-pulse" />
                  <div className="w-full h-px bg-gray-200" />
                  <div className="w-28 h-5 rounded-lg bg-gray-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Chart Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-32 h-4 rounded-full bg-gray-200 animate-pulse mb-5" />
                <div className="flex items-end gap-4 h-40 px-2">
                  {[60, 90, 45, 75, 55].map((h, j) => (
                    <div
                      key={j}
                      className="flex-1 rounded-t-md bg-gray-100 animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${j * 50}ms` }}
                    />
                  ))}
                </div>
                <div className="flex justify-around mt-3">
                  {[...Array(5)].map((_, j) => (
                    <div
                      key={j}
                      className="w-10 h-3 rounded-full bg-gray-100 animate-pulse"
                      style={{ animationDelay: `${j * 40}ms` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="w-40 h-4 rounded-full bg-gray-200 animate-pulse mb-4" />
            {/* Header Row */}
            <div className="grid grid-cols-5 gap-3 pb-3 border-b border-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3 rounded-full bg-gray-200 animate-pulse" />
              ))}
            </div>
            {/* Data Rows */}
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-3 py-3 border-b border-gray-50"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {[...Array(5)].map((_, j) => (
                  <div
                    key={j}
                    className="h-3 rounded-full bg-gray-100 animate-pulse"
                    style={{ width: `${60 + Math.random() * 40}%` }}
                  />
                ))}
              </div>
            ))}
          </div>

        </main>
      </div>

      {/* ── Central Loading Indicator ── */}
      <div
        className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50"
        style={{ backgroundColor: TELKOM_RED }}
      >
        {/* Spinner */}
        <svg
          className="animate-spin"
          style={{ width: 18, height: 18 }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <span>Menyiapkan Dashboard...</span>
      </div>

    </div>
  );
}
