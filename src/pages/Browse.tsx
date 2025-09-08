import React from 'react';
import { useAuth } from '../context/auth';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { CircularProgress } from '@mui/material';
import { useToast } from '../context/toast';

interface Category {
  id: string;
  name: string;
  icons: Array<{ url: string; height: number; width: number }>;
}

const Browse: React.FC = () => {
  const { token, isLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  // Fetch categories from Spotify
  const fetchCategories = React.useCallback(async () => {
    if (!token || loadingCategories) return;
    
    setLoadingCategories(true);
    setError('');
    
    try {
      const response = await fetch('https://api.spotify.com/v1/browse/categories?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCategories(data.categories?.items || []);
      
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
      toast.showToast('Unable to load categories', 'error');
    } finally {
      setLoadingCategories(false);
    }
  }, [token, loadingCategories, toast]);

  // Load categories when component mounts
  React.useEffect(() => {
    if (token && !isLoading) {
      fetchCategories();
    }
  }, [token, isLoading, fetchCategories]);

  // Handle category click
  const handleCategoryClick = (category: Category) => {
    // For now, navigate to search with category name as query
    // Later this could be expanded to dedicated category pages
    navigate(`/search?q=${encodeURIComponent(category.name)}`);
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Browse Categories</h1>
            <p className="text-gray-400">Discover music by genre and mood</p>
          </div>

          {/* Loading State */}
          {loadingCategories && (
            <div className="flex items-center justify-center py-20">
              <CircularProgress size={60} sx={{ color: '#22c55e' }} />
            </div>
          )}

          {/* Error State */}
          {error && !loadingCategories && (
            <div className="text-center py-20">
              <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-8 max-w-md mx-auto">
                <h3 className="text-red-400 font-semibold mb-2">Unable to Load Categories</h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <button 
                  onClick={fetchCategories}
                  className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Categories Grid */}
          {!loadingCategories && !error && categories.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {categories.map((category) => (
                <div 
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm aspect-square">
                    
                    {/* Category Image */}
                    <div className="absolute inset-0">
                      <img 
                        src={category.icons?.[0]?.url || '/vite.svg'} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                    
                    {/* Category Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-bold text-sm truncate group-hover:text-green-400 transition-colors">
                        {category.name}
                      </h3>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Categories State */}
          {!loadingCategories && !error && categories.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-white/5 rounded-2xl p-8 max-w-md mx-auto">
                <h3 className="text-gray-400 font-semibold mb-2">No Categories Found</h3>
                <p className="text-gray-500 mb-4">Unable to find any music categories at the moment</p>
                <button 
                  onClick={fetchCategories}
                  className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Browse;
