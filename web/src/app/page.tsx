import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">Ustbian</h1>
        <p className="text-xl text-gray-600 mb-8">Your University Social Network</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium transition shadow-md"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 font-medium transition shadow-md"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
