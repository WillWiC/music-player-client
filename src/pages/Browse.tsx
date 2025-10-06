import React from 'react';
import { useAuth } from '../context/auth';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getAllCategories, type CustomCategory } from '../utils/categoryMapping';
import { Fade, Grow, Skeleton } from '@mui/material';

const Browse: React.FC = () => {
  const { token, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [categories, setCategories] = React.useState<CustomCategory[]>([]);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Load our custom categories
  React.useEffect(() => {
    setLoading(true);
    const customCategories = getAllCategories();
    setCategories(customCategories);
    // Simulate loading for smooth animation
    setTimeout(() => setLoading(false), 300);
  }, []);

  // Handle category click
  const handleCategoryClick = (category: CustomCategory) => {
    // Navigate to dedicated category page
    navigate(`/category/${category.id}`);
  };

  // Guest experience
  if (!token && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

        <main className="flex-1 lg:ml-72 pb-24 pt-20">
          <div className="relative max-w-6xl mx-auto py-20 px-6 sm:px-8 lg:px-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">Browse Music Categories</h1>
              <p className="text-gray-400 mb-8">Sign in to explore music categories and discover new genres</p>
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />
      
      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-7xl mx-auto py-10 px-6 sm:px-8 lg:px-12">
          
          {/* Page Header */}
          <Fade in timeout={600}>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Browse Categories</h1>
              <p className="text-gray-400">Discover music by genre and mood</p>
            </div>
          </Fade>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <Grow in key={i} timeout={300 + i * 50}>
                  <div className="aspect-square">
                    <Skeleton 
                      variant="rectangular" 
                      width="100%" 
                      height="100%" 
                      sx={{ 
                        borderRadius: 3, 
                        bgcolor: 'rgba(255,255,255,0.05)' 
                      }} 
                    />
                  </div>
                </Grow>
              ))}
            </div>
          )}

          {/* Categories Grid */}
          {!loading && categories.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <Grow in timeout={400 + index * 50} key={category.id}>
                  <div 
                    onClick={() => handleCategoryClick(category)}
                    className="group cursor-pointer"
                  >
                    <div 
                      className="relative overflow-hidden rounded-xl border border-white/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm aspect-square"
                      style={{ 
                        background: `linear-gradient(135deg, ${category.color}20, ${category.color}10)` 
                      }}
                    >
                      
                      {/* Category Icon */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <div className="text-4xl mb-2">{category.icon}</div>
                        <h3 className="text-white font-bold text-sm group-hover:text-green-400 transition-colors">
                          {category.name}
                        </h3>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </Grow>
              ))}
            </div>
          )}

          {/* No Categories State */}
          {!loading && categories.length === 0 && (
            <Fade in timeout={600}>
              <div className="text-center py-20">
                <div className="bg-white/5 rounded-2xl p-8 max-w-md mx-auto">
                  <h3 className="text-gray-400 font-semibold mb-2">No Categories Available</h3>
                  <p className="text-gray-500 mb-4">Categories are being loaded</p>
                </div>
              </div>
            </Fade>
          )}
        </div>
      </main>
    </div>
  );
};

export default Browse;
