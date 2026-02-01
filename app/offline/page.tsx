"use client"

/**
 * Offline page - shown when no network connection
 */

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6">
        <div className="text-center">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You&apos;re offline
          </h1>

          <p className="text-gray-600 mb-8">
            It looks like you&apos;ve lost your internet connection.
            Don&apos;t worry - you can still access your tasks and create new ones.
            Your changes will sync automatically when you&apos;re back online.
          </p>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                What you can do offline:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• View all your tasks and projects</li>
                <li>• Create new tasks</li>
                <li>• Edit existing tasks</li>
                <li>• Mark tasks as complete</li>
                <li>• Organize tasks into projects</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">
                What requires internet:
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Initial sign in</li>
                <li>• Syncing with other devices</li>
                <li>• Collaborative features</li>
                <li>• Email notifications</li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            This page will automatically refresh when your connection is restored.
          </p>
        </div>
      </div>
    </div>
  )
}
