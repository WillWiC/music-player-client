import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const About: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="w-full max-w-4xl mx-auto py-24 px-6">
          <h1 className="text-4xl font-extrabold mb-4">About</h1>

          <p className="text-gray-300 mb-4">Spotify Lite is a compact web client built on top of the Spotify Web API and Web Playback SDK. It focuses on fast, minimal playback and discovery features while keeping a small footprint.</p>

          <section className="mt-6">
            <h2 className="text-2xl font-semibold mb-2">Core features</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Sign in with Spotify and control playback.</li>
              <li>View what’s playing across your devices and transfer playback.</li>
              <li>Search, browse, and play tracks using a minimal UI.</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-2xl font-semibold mb-2">Privacy</h2>
            <p className="text-gray-300">Authentication is handled by Spotify. The app requests only the scopes necessary for playback and reading your library. Tokens are kept in memory and not persisted to disk by default.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-2xl font-semibold mb-2">Contributing</h2>
            <p className="text-gray-300">This project is open for contributions. Please open issues or pull requests on the repository for bug reports and feature requests.</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
