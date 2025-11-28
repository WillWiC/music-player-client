import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { 
  Container, 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  Button
} from '@mui/material';
import { 
  CheckCircle, 
  Security, 
  Code, 
  MusicNote,
  Speed,
  Devices,
  GitHub
} from '@mui/icons-material';

const About: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const features = [
    { icon: <MusicNote fontSize="large" />, text: "Spotify Integration", desc: "Seamless playback control & library access" },
    { icon: <Speed fontSize="large" />, text: "High Performance", desc: "Optimized for speed and minimal resource usage" },
    { icon: <Devices fontSize="large" />, text: "Cross-Device", desc: "Control playback on any active Spotify device" },
    { icon: <CheckCircle fontSize="large" />, text: "Smart Discovery", desc: "AI-powered music recommendation engine" }
  ];

  return (
    <div className="min-h-[100dvh] app-background flex safe-area-bottom">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onHomeClick={() => navigate('/dashboard')}
      />
      
      <div className="flex-1 flex flex-col lg:ml-72 relative">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        
        <main className="flex-1 pb-36 sm:pb-32 pt-20 sm:pt-24 px-3 sm:px-6 lg:px-8">
          <Container maxWidth="lg">
            {/* Hero Header */}
            <div className="flex flex-col items-center text-center mb-8 sm:mb-16">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl mb-4 sm:mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
                <MusicNote sx={{ fontSize: { xs: 32, sm: 50 }, color: 'white' }} />
              </div>
              
              <Typography variant="overline" className="text-blue-400 font-bold tracking-[0.15em] sm:tracking-[0.2em] mb-1 sm:mb-2 text-[10px] sm:text-xs">
                Version 1.0.0
              </Typography>
              
              <Typography variant="h2" className="text-white font-black mb-2 sm:mb-4 tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                About Flowbeats
              </Typography>
              
              <Typography className="text-gray-400 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed px-4">
                A modern, lightweight web client built on top of the Spotify Web API. 
                Designed for a distraction-free listening experience with powerful discovery tools.
              </Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8">
              {/* Features Grid */}
              <div className="col-span-1 md:col-span-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {features.map((feature, index) => (
                    <Card key={index} className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300">
                      <CardContent className="p-3 sm:p-6 flex flex-col items-center text-center h-full">
                        <div className="text-blue-500 mb-2 sm:mb-4 p-2 sm:p-3 bg-blue-500/10 rounded-full">
                          {React.cloneElement(feature.icon, { fontSize: 'medium' })}
                        </div>
                        <Typography variant="h6" className="text-white font-bold mb-1 sm:mb-2 text-sm sm:text-base">
                          {feature.text}
                        </Typography>
                        <Typography className="text-gray-400 text-xs sm:text-sm">
                          {feature.desc}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tech Stack & Info */}
              <div className="col-span-1 md:col-span-8">
                <Card className="bg-white/5 border border-white/10 h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Code className="text-purple-500" />
                      <Typography variant="h5" className="text-white font-bold">
                        Built With Modern Tech
                      </Typography>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mb-8">
                      {['React 18', 'TypeScript', 'Vite', 'Material UI', 'Tailwind CSS', 'Spotify Web API', 'Redux Toolkit'].map((tech) => (
                        <Chip 
                          key={tech} 
                          label={tech} 
                          className="bg-white/5 text-white border border-white/10 font-medium hover:bg-white/10" 
                        />
                      ))}
                    </div>

                    <div className="p-6 bg-black/20 rounded-xl border border-white/5">
                      <Typography className="text-gray-300 leading-relaxed">
                        Flowbeats is an open-source project created for educational purposes. 
                        It demonstrates advanced React patterns, state management, and integration with third-party APIs.
                      </Typography>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Privacy & Links */}
              <div className="col-span-1 md:col-span-4">
                <div className="space-y-6 h-full">
                  <Card className="bg-gradient-to-br from-green-900/20 to-black border border-green-500/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Security className="text-green-500" />
                        <Typography variant="h6" className="text-white font-bold">
                          Privacy First
                        </Typography>
                      </div>
                      <Typography className="text-gray-400 text-sm mb-4">
                        We respect your data. Authentication is handled directly by Spotify, and tokens are stored locally in your browser.
                      </Typography>
                      <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
                        <CheckCircle fontSize="small" />
                        <span>No Server Storage</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border border-white/10">
                    <CardContent className="p-6 text-center">
                      <Typography className="text-gray-400 text-sm mb-4">
                        Check out the source code
                      </Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<GitHub />}
                        onClick={() => window.open('https://github.com/WillWiC/music-player-client', '_blank')}
                        fullWidth
                        className="border-white/20 text-white hover:bg-white/10 hover:border-white"
                      >
                        GitHub Repository
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Footer */}
              <div className="col-span-1 md:col-span-12">
                <div className="text-center py-8 border-t border-white/5 mt-8">
                  <Typography className="text-gray-500 text-sm">
                    © {new Date().getFullYear()} Flowbeats. Not affiliated with Spotify AB.
                  </Typography>
                </div>
              </div>
            </div>
          </Container>
        </main>
      </div>
    </div>
  );
};

export default About;
