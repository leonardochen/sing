import { useState, FormEvent } from 'react';
import Head from 'next/head';

export default function Add() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!youtubeUrl.trim() || !userName.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    // Validate YouTube URL format
    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      setMessage({ type: 'error', text: 'Please enter a valid YouTube URL' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/queue/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl.trim(),
          userName: userName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Song added to queue! Thanks, ${userName}!` });
        setYoutubeUrl('');
        setUserName('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add song to queue' });
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
      setMessage({ type: 'error', text: 'Failed to add song to queue. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add Song - Karaoke Queue</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4 relative">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-lg">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-gray-800 mb-3">🎤 Add Your Song</h1>
            <p className="text-xl text-gray-600">Join the karaoke queue!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="userName" className="block text-lg font-semibold text-gray-700 mb-3">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all text-gray-900"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="youtubeUrl" className="block text-lg font-semibold text-gray-700 mb-3">
                YouTube URL
              </label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all text-gray-900"
                disabled={isSubmitting}
                required
              />
              <p className="mt-3 text-base text-gray-500">
                Paste the URL of the YouTube video you want to sing
              </p>
            </div>

            {message && (
              <div
                className={`p-5 rounded-xl text-lg font-medium ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-red-100 text-red-800 border-2 border-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 px-8 rounded-2xl font-bold text-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transform hover:scale-105 active:scale-95"
            >
              {isSubmitting ? '⏳ Adding...' : '🎵 Add to Queue'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

