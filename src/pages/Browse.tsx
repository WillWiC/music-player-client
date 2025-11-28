import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getAllCategories, type CustomCategory } from '../utils/categoryMapping';
import { Fade, Grow, Skeleton } from '@mui/material';

const Browse: React.FC = () => {
  const { token, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load our custom categories
  useEffect(() => {
    setLoading(true);
    const customCategories = getAllCategories();
    setCategories(customCategories);
    // Simulate loading for smooth animation
    setTimeout(() => setLoading(false), 300);
  }, []);

  // Handle category click
  const handleCategoryClick = (category: CustomCategory) => {
    navigate(`/category/${category.id}`);
  };

  // Guest experience
  if (!token && !isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-900/30 via-gray-900 to-black flex" style={{ minHeight: '100dvh' }}>
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

        <main className="flex-1 ml-72 pb-28 pt-20">
          <div className="relative max-w-6xl mx-auto py-12 lg:py-16 xl:py-20 px-4 lg:px-8 xl:px-12">
            <div className="text-center">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">Browse Music Categories</h1>
              <p className="text-gray-400 mb-6 lg:mb-8 text-base lg:text-lg px-4">Sign in to explore music categories and discover new genres</p>
              <button 
                onClick={() => navigate('/login')}
                className="px-6 lg:px-8 py-2.5 lg:py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-transform hover:scale-105 active:scale-95 text-sm lg:text-base"
              >
                Sign In to Browse
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900/30 via-gray-900 to-black flex" style={{ minHeight: '100dvh' }}>
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />
      
      <main className="flex-1 ml-72 pb-28 pt-20 px-4 lg:px-8 xl:px-12">
        
        {/* Header */}
        <div className="mb-6 lg:mb-10">
            <Fade in timeout={600}>
                <div>
                    <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-1 lg:mb-2">Browse</h1>
                    <p className="text-gray-400 text-sm lg:text-lg">Explore by genre, mood, and culture</p>
                </div>
            </Fade>
        </div>

        {/* Loading State */}
        {loading && (
            <div className="space-y-6 lg:space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} variant="rectangular" height={120} sx={{ bgcolor: '#242424', borderRadius: 2 }} />
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={100} sx={{ bgcolor: '#242424', borderRadius: 2 }} />
                    ))}
                </div>
            </div>
        )}

        {/* Content */}
        {!loading && (
            <div className="space-y-6 sm:space-y-8">
                
                {/* Section Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-white">Browse all</h2>
                
                {/* All Categories - Spotify-style rectangular cards */}
                <section>           
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                        {categories.map((category, index) => (
                            <Grow in timeout={300 + (index % 10) * 50} key={category.id}>
                                <div 
                                    onClick={() => handleCategoryClick(category)}
                                    className="relative aspect-[2/1] rounded-lg overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 active:scale-95"
                                    style={{ backgroundColor: category.color }}
                                >
                                    {/* Category Name */}
                                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                                        <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-white drop-shadow-lg">
                                            {category.name}
                                        </h3>
                                    </div>
                                    
                                    {/* Decorative Image/Icon - rotated in bottom right */}
                                    <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 transform rotate-[25deg] opacity-90 group-hover:scale-110 group-hover:rotate-[20deg] transition-transform duration-300">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/10 rounded-md shadow-2xl flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-3xl sm:text-4xl lg:text-5xl drop-shadow-md">{category.icon}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Subtle gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            </Grow>
                        ))}
                    </div>
                </section>
            </div>
        )}
      </main>
    </div>
  );
};

export default Browse;
