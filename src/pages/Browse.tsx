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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900/30 via-gray-900 to-black flex">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

        <main className="flex-1 lg:ml-72 pb-24 pt-20">
          <div className="relative max-w-6xl mx-auto py-20 px-6 sm:px-8 lg:px-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-6">Browse Music Categories</h1>
              <p className="text-gray-400 mb-8 text-lg">Sign in to explore music categories and discover new genres</p>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-transform hover:scale-105"
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900/30 via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />
      
      <main className="flex-1 lg:ml-72 pb-24 pt-20 px-6 sm:px-8 lg:px-12">
        
        {/* Header */}
        <div className="mb-10">
            <Fade in timeout={600}>
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Browse</h1>
                    <p className="text-gray-400 text-lg">Explore by genre, mood, and culture</p>
                </div>
            </Fade>
        </div>

        {/* Loading State */}
        {loading && (
            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} variant="rectangular" height={200} sx={{ bgcolor: '#242424', borderRadius: 4 }} />
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={160} sx={{ bgcolor: '#242424', borderRadius: 2 }} />
                    ))}
                </div>
            </div>
        )}

        {/* Content */}
        {!loading && (
            <div className="space-y-8">
                
                {/* All Categories */}
                <section>           
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {categories.map((category, index) => (
                            <Grow in timeout={300 + (index % 10) * 50} key={category.id}>
                                <div 
                                    onClick={() => handleCategoryClick(category)}
                                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
                                    style={{ backgroundColor: category.color }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30" />
                                    <div className="absolute inset-0 p-4">
                                        <h3 className="text-xl font-bold text-white break-words max-w-[80%] drop-shadow-md">
                                            {category.name}
                                        </h3>
                                    </div>
                                    <div className="absolute bottom-2 right-2 transform rotate-12 translate-x-2 translate-y-2 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                                        <span className="text-6xl shadow-sm">{category.icon}</span>
                                    </div>
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
