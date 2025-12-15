import { useState, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';

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

      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🎤 Add Your Song</h1>
            <p className="text-gray-600">Join the karaoke queue!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
                disabled={isSubmitting}
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Paste the URL of the YouTube video you want to sing
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? 'Adding...' : 'Add to Queue'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/splash"
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              ← Back to Now Playing
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

