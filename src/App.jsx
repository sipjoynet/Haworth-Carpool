import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { User, Users, MapPin, Calendar, Plus, Home, ArrowRight, Check, X, Settings, LogOut, ChevronDown, Phone, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import DB from './lib/database.js';
import { supabase } from './lib/supabase.js';

// ============================================================================
// LOGO COMPONENT
// ============================================================================

const Logo = ({ size = 60, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <path d="M 70 10 L 120 30 L 120 80 Q 120 110, 70 130 Q 20 110, 20 80 L 20 30 Z"
          fill="none" stroke={color} strokeWidth="1.5"/>
    <line x1="50" y1="45" x2="50" y2="95" stroke={color} strokeWidth="2"/>
    <line x1="90" y1="45" x2="90" y2="95" stroke={color} strokeWidth="2"/>
    <rect x="50" y="68" width="40" height="4" fill={color}/>
  </svg>
);

// ============================================================================
// ADDRESS WITH GOOGLE MAPS LINK COMPONENT
// ============================================================================

const AddressWithLink = ({ address, style = {} }) => {
  const openInGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
      <span style={{ flex: 1, minWidth: 0 }}>{address}</span>
      <ExternalLink
        size={14}
        style={{
          color: '#0066cc',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'color 0.2s'
        }}
        onClick={openInGoogleMaps}
        onMouseEnter={(e) => e.target.style.color = '#004499'}
        onMouseLeave={(e) => e.target.style.color = '#0066cc'}
      />
    </div>
  );
};

// ============================================================================
// RESPONSIVE HOOK
// ============================================================================

const useWindowSize = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, width: window.innerWidth };
};

// ============================================================================
// BOTTOM NAVIGATION (MOBILE ONLY)
// ============================================================================

const BottomNav = () => {
  const { currentUser, screen, setScreen, activeGroup, setActiveGroup } = useApp();
  const { isMobile } = useWindowSize();

  if (!isMobile) return null;

  const navItems = [
    { key: 'groups', icon: Users, label: 'Groups', show: true },
    { key: 'feed', icon: Home, label: 'Rides', show: !!activeGroup },
    { key: 'profile', icon: User, label: 'Profile', show: true },
    { key: 'admin', icon: Settings, label: 'Admin', show: currentUser?.is_admin }
  ].filter(item => item.show);

  const handleNavClick = (key) => {
    if (key === 'groups') {
      setActiveGroup(null);
      setScreen('groups');
    } else {
      setScreen(key);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderTop: '1px solid #f0f0f0',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
      zIndex: 1000
    }}>
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = screen === item.key || (item.key === 'feed' && screen === 'create_ride') || (item.key === 'feed' && screen === 'group_settings');

        return (
          <button
            key={item.key}
            onClick={() => handleNavClick(item.key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: isActive ? '#000' : '#999',
              transition: 'color 0.2s',
              minWidth: 0
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{
              fontSize: '11px',
              fontWeight: isActive ? '600' : '500',
              letterSpacing: '-0.1px'
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// DATABASE - Now using Supabase instead of localStorage
// ============================================================================
// The DB object is imported from ./lib/database.js
// It provides the same interface as the previous localStorage implementation

// ============================================================================
// CONTEXT & AUTH
// ============================================================================

const AppContext = createContext();

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function CarpoolApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [screen, setScreen] = useState('login');
  const [refreshKey, setRefreshKey] = useState(0);
  const [initError, setInitError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔄 Initializing Haworth Carpool...');
        console.log('Environment check:', {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
          supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
        });

        await DB.init();
        console.log('✅ Database initialized successfully');

        // Check for existing Supabase Auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('✅ Found existing session, checking user profile');
          // Get user from database by auth_user_id
          let user = await DB.findOne('users', u => u.auth_user_id === session.user.id);

          // If no user profile exists and this is a Google OAuth user, create a basic profile
          if (!user && session.user.app_metadata.provider === 'google') {
            console.log('📝 Creating profile for new Google user');
            try {
              user = await DB.create('users', {
                email: session.user.email,
                auth_user_id: session.user.id,
                name: session.user.user_metadata.full_name || session.user.email.split('@')[0],
                phone: '',
                home_address: '',
                is_approved: false,
                is_admin: false,
                password: null
              });
              console.log('✅ Profile created, awaiting admin approval');
              alert('Welcome! Your account has been created and is pending admin approval.');
              await supabase.auth.signOut();
            } catch (err) {
              console.error('Failed to create user profile:', err);
              await supabase.auth.signOut();
            }
          } else if (user && user.is_approved) {
            setCurrentUser(user);
            setScreen('groups');
            console.log('✅ User logged in automatically');
          } else if (user && !user.is_approved) {
            console.log('⏳ User pending approval');
            alert('Your account is pending admin approval. Please wait for approval.');
            await supabase.auth.signOut();
          } else {
            console.log('⚠️ No user record found for auth session');
            await supabase.auth.signOut();
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setInitError(error.message || 'Failed to initialize database');
      }
    };

    initializeApp();
  }, []);

  const refresh = () => setRefreshKey(k => k + 1);

  const contextValue = {
    currentUser,
    setCurrentUser,
    activeGroup,
    setActiveGroup,
    screen,
    setScreen,
    refresh,
    refreshKey
  };

  // Show error state if initialization failed
  if (initError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '32px',
          background: '#fff5f5',
          border: '2px solid #fc8181',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#c53030', marginBottom: '12px' }}>
            Initialization Error
          </h1>
          <p style={{ fontSize: '16px', color: '#742a2a', marginBottom: '16px' }}>
            {initError}
          </p>
          <details style={{
            marginTop: '16px',
            padding: '12px',
            background: '#ffffff',
            borderRadius: '8px',
            textAlign: 'left',
            fontSize: '14px'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
              Troubleshooting
            </summary>
            <ul style={{ paddingLeft: '20px', color: '#4a5568' }}>
              <li>Check that VITE_SUPABASE_URL is set in environment variables</li>
              <li>Check that VITE_SUPABASE_ANON_KEY is set in environment variables</li>
              <li>Verify Supabase project is active and accessible</li>
              <li>Check browser console for detailed error messages</li>
            </ul>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Logo size={80} color="#667eea" />
          <p style={{ marginTop: '20px', fontSize: '16px', color: '#4a5568' }}>
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        {!currentUser ? (
          <LoginScreen />
        ) : (
          <MainApp />
        )}
      </div>
    </AppContext.Provider>
  );
}

// ============================================================================
// LOGIN SCREEN
// ============================================================================

function LoginScreen() {
  const { setCurrentUser, setScreen } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    name: '',
    phone: '',
    home_address: ''
  });
  const { isMobile } = useWindowSize();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('Invalid email or password');
        return;
      }

      // Get user from database
      const user = await DB.findOne('users', u => u.auth_user_id === data.user.id);

      if (!user) {
        setError('User account not found');
        await supabase.auth.signOut();
        return;
      }

      if (!user.is_approved) {
        setError('Your account is pending approval');
        await supabase.auth.signOut();
        return;
      }

      setCurrentUser(user);
      setScreen('groups');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !signupData.name || !signupData.phone || !signupData.home_address) {
      setError('All fields are required');
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await DB.findOne('users', u => u.email === email);
      if (existingUser) {
        setError('Email already registered');
        return;
      }

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Create user profile in database
      await DB.create('users', {
        email,
        auth_user_id: data.user.id,
        name: signupData.name,
        phone: signupData.phone,
        home_address: signupData.home_address,
        is_approved: false,
        is_admin: false,
        password: null // Password stored securely in Supabase Auth
      });

      // Sign out immediately (user needs admin approval)
      await supabase.auth.signOut();

      setError('');
      alert('Account created! Please wait for admin approval.');
      setIsSignup(false);
      setEmail('');
      setPassword('');
      setSignupData({ name: '', phone: '', home_address: '' });
    } catch (err) {
      console.error('Signup error:', err);
      setError('An error occurred during signup');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (error) {
        setError('Failed to sign in with Google');
        console.error('Google sign-in error:', error);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('An error occurred during Google sign-in');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: isMobile ? '16px' : '20px',
      background: '#000'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: isMobile ? '32px 24px' : '48px 40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? '20px' : '24px' }}>
          <Logo size={isMobile ? 64 : 80} color="#000" />
        </div>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: isMobile ? '28px' : '36px',
          fontWeight: '700',
          color: '#000',
          letterSpacing: '-0.5px',
          textAlign: 'center'
        }}>
          Haworthians Carpool
        </h1>

        <form onSubmit={isSignup ? handleSignup : handleLogin} style={{ marginTop: '40px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
                background: '#f6f6f6',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              placeholder="Email"
              onFocus={(e) => e.target.style.background = '#efefef'}
              onBlur={(e) => e.target.style.background = '#f6f6f6'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
                background: '#f6f6f6',
                outline: 'none'
              }}
              placeholder="Password"
              onFocus={(e) => e.target.style.background = '#efefef'}
              onBlur={(e) => e.target.style.background = '#f6f6f6'}
            />
          </div>

          {isSignup && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: '#f6f6f6',
                    outline: 'none'
                  }}
                  placeholder="Full Name"
                  onFocus={(e) => e.target.style.background = '#efefef'}
                  onBlur={(e) => e.target.style.background = '#f6f6f6'}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="tel"
                  value={signupData.phone}
                  onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: '#f6f6f6',
                    outline: 'none'
                  }}
                  placeholder="Phone Number"
                  onFocus={(e) => e.target.style.background = '#efefef'}
                  onBlur={(e) => e.target.style.background = '#f6f6f6'}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  value={signupData.home_address}
                  onChange={(e) => setSignupData({...signupData, home_address: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: '#f6f6f6',
                    outline: 'none'
                  }}
                  placeholder="Home Address"
                  onFocus={(e) => e.target.style.background = '#efefef'}
                  onBlur={(e) => e.target.style.background = '#f6f6f6'}
                />
              </div>
            </>
          )}

          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fff4f4',
              color: '#d32f2f',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '16px',
              border: '1px solid #ffcdd2'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#333'}
            onMouseLeave={(e) => e.target.style.background = '#000'}
          >
            {isSignup ? 'Sign Up' : 'Sign In'}
          </button>

          {!isSignup && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '24px 0 16px',
                color: '#999',
                fontSize: '14px'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
                <span>or</span>
                <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'white',
                  color: '#444',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f8f8f8'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: '#000',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

function MainApp() {
  const { currentUser, screen, setScreen, activeGroup } = useApp();
  const { isMobile } = useWindowSize();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{
        flex: 1,
        padding: isMobile ? '16px' : '20px',
        paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '20px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        {screen === 'groups' && <GroupsScreen />}
        {screen === 'feed' && activeGroup && <FeedScreen />}
        {screen === 'create_ride' && activeGroup && <CreateRideScreen />}
        {screen === 'group_settings' && activeGroup && <GroupSettingsScreen />}
        {screen === 'profile' && <ProfileScreen />}
        {screen === 'admin' && currentUser.is_admin && <AdminScreen />}
      </div>
      <BottomNav />
    </div>
  );
}

// ============================================================================
// HEADER
// ============================================================================

function Header() {
  const { currentUser, setCurrentUser, setScreen, activeGroup, setActiveGroup } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const { isMobile } = useWindowSize();

  const handleLogout = async () => {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveGroup(null);
    setScreen('login');
  };

  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #f0f0f0',
      padding: isMobile ? '12px 16px' : '20px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <button
          onClick={() => {
            setScreen('groups');
            setActiveGroup(null);
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <Logo size={isMobile ? 28 : 36} color="#000" />
          {!isMobile && (
            <span style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#000',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.5px'
            }}>
              Haworthians
            </span>
          )}
        </button>
        {activeGroup && (
          <>
            {!isMobile && <span style={{ color: '#c0c0c0', flexShrink: 0 }}>/</span>}
            <span style={{
              fontSize: isMobile ? '14px' : '16px',
              color: '#545454',
              fontWeight: isMobile ? '600' : '400',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginLeft: isMobile ? '4px' : '0'
            }}>
              {activeGroup.name}
            </span>
          </>
        )}
      </div>

      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isMobile ? '6px' : '10px 16px',
            background: '#f6f6f6',
            border: 'none',
            borderRadius: '100px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#000',
            maxWidth: isMobile ? 'auto' : '180px'
          }}
        >
          <div style={{
            width: isMobile ? '36px' : '32px',
            height: isMobile ? '36px' : '32px',
            borderRadius: '50%',
            background: '#000',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            flexShrink: 0
          }}>
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          {!isMobile && (
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block',
              maxWidth: '100px'
            }}>
              {currentUser.name}
            </span>
          )}
        </button>

        {showMenu && (
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99
              }}
              onClick={() => setShowMenu(false)}
            />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: isMobile ? '12px' : '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              minWidth: isMobile ? '160px' : '200px',
              zIndex: 100,
              overflow: 'hidden'
            }}>
              {!isMobile && (
                <>
                  <button
                    onClick={() => {
                      setScreen('profile');
                      setShowMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: '#000',
                      fontWeight: '400',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f6f6f6'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    <User size={18} />
                    My Profile
                  </button>

                  {currentUser.is_admin && (
                    <button
                      onClick={() => {
                        setScreen('admin');
                        setShowMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#000',
                        fontWeight: '400',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f6f6f6'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      <Settings size={18} />
                      Admin Panel
                    </button>
                  )}

                  <div style={{ height: '1px', background: '#e0e0e0', margin: '4px 0' }} />
                </>
              )}

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: isMobile ? '16px' : '14px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#000',
                  fontWeight: '400',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f6f6f6'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                <LogOut size={isMobile ? 20 : 18} />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// GROUPS SCREEN
// ============================================================================

function GroupsScreen() {
  const { currentUser, setActiveGroup, setScreen, refreshKey } = useApp();
  const [groups, setGroups] = useState([]);
  const { isMobile } = useWindowSize();

  useEffect(() => {
    loadGroups();
  }, [currentUser, refreshKey]);

  const loadGroups = async () => {
    const memberships = await DB.query('group_members', m => m.user_id === currentUser.id);
    const groupIds = memberships.map(m => m.group_id);
    const userGroups = await DB.query('groups', g => groupIds.includes(g.id) && !g.archived);
    setGroups(userGroups);
  };

  const handleSelectGroup = (group) => {
    setActiveGroup(group);
    setScreen('feed');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px' }}>
      <h2 style={{ 
        fontSize: '32px', 
        fontWeight: '700', 
        color: '#000', 
        marginBottom: '8px',
        letterSpacing: '-0.5px'
      }}>
        Your Groups
      </h2>
      <p style={{ 
        fontSize: '16px', 
        color: '#545454', 
        marginBottom: '32px',
        fontWeight: '400'
      }}>
        Select a group to view and request rides
      </p>

      {groups.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '48px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#545454',
          border: '1px solid #e0e0e0'
        }}>
          <Users size={56} style={{ margin: '0 auto 20px', opacity: 0.3, color: '#000' }} />
          <p style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#000', fontWeight: '500' }}>No groups yet</p>
          <p style={{ fontSize: '14px', margin: 0 }}>Contact an admin to join a group</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => handleSelectGroup(group)}
              style={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
                {group.name}
              </div>
              <div style={{ fontSize: '14px', color: '#545454', fontWeight: '400' }}>
                Tap to view rides →
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FEED SCREEN
// ============================================================================

function FeedScreen() {
  const { currentUser, activeGroup, setScreen, refreshKey } = useApp();
  const [rides, setRides] = useState([]);
  const [pastRides, setPastRides] = useState([]);
  const [filter, setFilter] = useState('open');
  const { isMobile } = useWindowSize();

  useEffect(() => {
    loadRides();
  }, [activeGroup, refreshKey, filter]);

  const isRideOld = (ride) => {
    const rideDate = new Date(ride.ride_date);
    const oneDayAgo = new Date(Date.now() - 86400000); // 24 hours ago
    return rideDate < oneDayAgo;
  };

  const loadRides = async () => {
    let rideRequests = await DB.query('ride_requests', r => r.group_id === activeGroup.id);

    if (filter === 'open') {
      rideRequests = rideRequests.filter(r => r.status === 'open' && !isRideOld(r));
    } else if (filter === 'mine') {
      rideRequests = rideRequests.filter(r => r.requester_id === currentUser.id);
      // Separate current and past rides for "my rides" tab
      const currentRides = rideRequests.filter(r => !isRideOld(r));
      const oldRides = rideRequests.filter(r => isRideOld(r));

      // Sort current rides
      currentRides.sort((a, b) => {
        if (a.ride_date !== b.ride_date) {
          return new Date(a.ride_date) - new Date(b.ride_date);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });

      // Sort past rides (most recent first)
      oldRides.sort((a, b) => {
        if (a.ride_date !== b.ride_date) {
          return new Date(b.ride_date) - new Date(a.ride_date);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setRides(currentRides);
      setPastRides(oldRides);
      return;
    } else if (filter === 'accepted') {
      rideRequests = rideRequests.filter(r =>
        r.accepter_id === currentUser.id && (r.status === 'accepted' || r.status === 'completed') && !isRideOld(r)
      );
    } else if (filter === 'all') {
      rideRequests = rideRequests.filter(r => !isRideOld(r));
    }

    // Sort by date and created time
    rideRequests.sort((a, b) => {
      if (a.ride_date !== b.ride_date) {
        return new Date(a.ride_date) - new Date(b.ride_date);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setRides(rideRequests);
    setPastRides([]);
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: isMobile ? '16px 0' : '24px 20px'
    }}>
      <div style={{ marginBottom: isMobile ? '20px' : '24px' }}>
        <h2 style={{
          fontSize: isMobile ? '24px' : '28px',
          fontWeight: '700',
          color: '#000',
          margin: '0 0 20px 0',
          letterSpacing: '-0.5px'
        }}>
          Rides
        </h2>
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          flexWrap: 'wrap',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            onClick={() => setScreen('create_ride')}
            style={{
              padding: '16px 28px',
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: '1 1 auto',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              letterSpacing: '-0.2px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1a1a1a'}
            onMouseLeave={(e) => e.target.style.background = '#000'}
          >
            <Plus size={18} />
            Request Ride
          </button>
          <button
            onClick={() => setScreen('group_settings')}
            style={{
              padding: '16px 28px',
              background: '#f5f5f5',
              color: '#000',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: '1 1 auto',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              letterSpacing: '-0.2px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e8e8e8'}
            onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
          >
            <Settings size={18} />
            Group Info
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'open', label: 'Open' },
          { key: 'accepted', label: 'I Accepted' },
          { key: 'mine', label: 'My Rides' },
          { key: 'all', label: 'All' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '12px 24px',
              background: filter === f.key ? '#171717' : '#f8f8f8',
              color: filter === f.key ? 'white' : '#666',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === f.key ? '600' : '500',
              flex: '1 1 auto',
              minWidth: 'fit-content',
              transition: 'all 0.15s ease',
              letterSpacing: '-0.2px'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rides.length === 0 && pastRides.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '48px 20px',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#545454',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <MapPin size={56} style={{ margin: '0 auto 20px', opacity: 0.3, color: '#000' }} />
          <p style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#000', fontWeight: '500' }}>No rides found</p>
          <p style={{ fontSize: '14px', margin: 0 }}>Be the first to request a ride</p>
        </div>
      ) : (
        <>
          {rides.length > 0 && (
            <div style={{ display: 'grid', gap: '12px', marginBottom: pastRides.length > 0 ? '32px' : '0' }}>
              {rides.map(ride => (
                <RideCard key={ride.id} ride={ride} onUpdate={loadRides} />
              ))}
            </div>
          )}

          {pastRides.length > 0 && filter === 'mine' && (
            <>
              <div style={{
                margin: rides.length > 0 ? '32px 0 16px 0' : '0 0 16px 0',
                paddingBottom: '12px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#999',
                  margin: 0,
                  letterSpacing: '-0.3px'
                }}>
                  Past Trips
                </h3>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {pastRides.map(ride => (
                  <RideCard key={ride.id} ride={ride} onUpdate={loadRides} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// RIDE CARD
// ============================================================================

function RideCard({ ride, onUpdate }) {
  const { currentUser } = useApp();
  const [requester, setRequester] = useState(null);
  const [passenger, setPassenger] = useState(null);
  const [poi, setPoi] = useState(null);
  const [accepter, setAccepter] = useState(null);
  const [childPhone, setChildPhone] = useState(null);

  useEffect(() => {
    loadRideDetails();
  }, [ride]);

  const loadRideDetails = async () => {
    const req = await DB.findOne('users', u => u.id === ride.requester_id);
    setRequester(req);

    const p = await DB.findOne('pois', p => p.id === ride.poi_id);
    setPoi(p);

    if (ride.passenger_type === 'parent') {
      setPassenger(req);
    } else {
      const child = await DB.findOne('children', c => c.id === ride.passenger_id);
      setPassenger(child);
      
      if (ride.status !== 'open' && (currentUser.id === ride.requester_id || currentUser.id === ride.accepter_id)) {
        setChildPhone(child.phone);
      }
    }

    if (ride.accepter_id) {
      const acc = await DB.findOne('users', u => u.id === ride.accepter_id);
      setAccepter(acc);
    }
  };

  const handleAccept = async () => {
    if (ride.requester_id === currentUser.id) {
      alert("You can't accept your own ride request");
      return;
    }

    await DB.update('ride_requests', ride.id, {
      status: 'accepted',
      accepter_id: currentUser.id,
      accepted_at: new Date().toISOString()
    });

    onUpdate();
  };

  const handleComplete = async () => {
    await DB.update('ride_requests', ride.id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    onUpdate();
  };

  const handleUnaccept = async () => {
    if (window.confirm('Are you sure you want to un-accept this ride?')) {
      await DB.update('ride_requests', ride.id, {
        status: 'open',
        accepter_id: null,
        accepted_at: null
      });
      onUpdate();
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this ride?')) {
      await DB.update('ride_requests', ride.id, {
        status: 'cancelled'
      });
      onUpdate();
    }
  };

  if (!requester || !passenger || !poi) return null;

  const isInvolved = currentUser.id === ride.requester_id || currentUser.id === ride.accepter_id;
  const canSeeContactInfo = ride.status !== 'open' && isInvolved;

  const statusColors = {
    open: { bg: '#e7f6ec', text: '#0d7d3c' },
    accepted: { bg: '#e3f3ff', text: '#0066cc' },
    completed: { bg: '#f0f0f0', text: '#545454' },
    cancelled: { bg: '#fff4f4', text: '#c53030' }
  };

  const statusColor = statusColors[ride.status] || statusColors.open;

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      border: 'none',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '6px 12px',
              background: statusColor.bg,
              color: statusColor.text,
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {ride.status}
            </span>
            <span style={{ fontSize: '14px', color: '#545454', fontWeight: '400' }}>
              {new Date(ride.ride_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
            {passenger.name}
          </div>
          <div style={{ fontSize: '14px', color: '#545454' }}>
            Requested by {requester.name}
          </div>
        </div>

        {ride.status === 'open' && ride.requester_id !== currentUser.id && (
          <button
            onClick={handleAccept}
            style={{
              padding: '10px 20px',
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              flexShrink: 0,
              marginLeft: '12px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#333'}
            onMouseLeave={(e) => e.target.style.background = '#000'}
          >
            Accept
          </button>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        background: '#f6f6f6',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {ride.direction === 'home_to_poi' ? (
            <Home size={16} style={{ color: 'white' }} />
          ) : (
            <MapPin size={16} style={{ color: 'white' }} />
          )}
        </div>
        <ArrowRight size={16} style={{ color: '#c0c0c0', flexShrink: 0 }} />
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {ride.direction === 'home_to_poi' ? (
            <MapPin size={16} style={{ color: 'white' }} />
          ) : (
            <Home size={16} style={{ color: 'white' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#000', marginBottom: '2px' }}>
            {ride.direction === 'home_to_poi' ? 'To' : 'From'} {poi.name}
          </div>
          <AddressWithLink
            address={poi.address}
            style={{ fontSize: '13px', color: '#545454' }}
          />
        </div>
      </div>

      {canSeeContactInfo && (
        <div style={{
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#545454', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Contact Information
          </div>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#545454', marginBottom: '4px', fontWeight: '500' }}>Requester</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>{requester.name}</div>
              <div style={{ fontSize: '14px', color: '#000', marginBottom: '2px' }}>{requester.phone}</div>
              <AddressWithLink
                address={requester.home_address}
                style={{ fontSize: '13px', color: '#545454' }}
              />
            </div>

            {accepter && (
              <div>
                <div style={{ fontSize: '12px', color: '#545454', marginBottom: '4px', fontWeight: '500' }}>Driver</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>{accepter.name}</div>
                <div style={{ fontSize: '14px', color: '#000' }}>{accepter.phone}</div>
              </div>
            )}

            {ride.passenger_type === 'child' && childPhone && (
              <div>
                <div style={{ fontSize: '12px', color: '#545454', marginBottom: '4px', fontWeight: '500' }}>Passenger</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>{passenger.name}</div>
                <div style={{ fontSize: '14px', color: '#000' }}>{childPhone || 'No phone number'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {ride.status === 'accepted' && isInvolved && (
        <div style={{ display: 'grid', gap: '8px' }}>
          <button
            onClick={handleComplete}
            style={{
              width: '100%',
              padding: '14px',
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#333'}
            onMouseLeave={(e) => e.target.style.background = '#000'}
          >
            <CheckCircle size={18} />
            Mark as Completed
          </button>
          
          {ride.accepter_id === currentUser.id && (
            <button
              onClick={handleUnaccept}
              style={{
                width: '100%',
                padding: '14px',
                background: 'white',
                color: '#545454',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f6f6f6';
                e.target.style.borderColor = '#000';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#e0e0e0';
              }}
            >
              <X size={18} />
              Un-accept Ride
            </button>
          )}
        </div>
      )}

      {ride.status === 'open' && ride.requester_id === currentUser.id && (
        <button
          onClick={handleCancel}
          style={{
            width: '100%',
            padding: '14px',
            background: 'white',
            color: '#c53030',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#fff4f4';
            e.target.style.borderColor = '#c53030';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'white';
            e.target.style.borderColor = '#ffcdd2';
          }}
        >
          <X size={18} />
          Cancel Request
        </button>
      )}
    </div>
  );
}

// ============================================================================
// CREATE RIDE SCREEN
// ============================================================================

function CreateRideScreen() {
  const { currentUser, activeGroup, setScreen, refresh } = useApp();
  const [passengerType, setPassengerType] = useState('parent');
  const [childId, setChildId] = useState('');
  const [direction, setDirection] = useState('home_to_poi');
  const [poiId, setPoiId] = useState('');
  const [rideDate, setRideDate] = useState(new Date().toISOString().split('T')[0]);

  const [children, setChildren] = useState([]);
  const [pois, setPois] = useState([]);
  const { isMobile } = useWindowSize();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const myChildren = await DB.query('children', c => c.parent_id === currentUser.id);
    setChildren(myChildren);

    const allPois = await DB.query('pois', p => !p.archived);
    setPois(allPois);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    if (rideDate !== today && rideDate !== tomorrow) {
      alert('Ride date must be today or tomorrow');
      return;
    }

    if (!poiId) {
      alert('Please select a destination');
      return;
    }

    if (passengerType === 'child' && !childId) {
      alert('Please select a child');
      return;
    }

    const passengerId = passengerType === 'parent' ? currentUser.id : parseInt(childId);
    const selectedPoiId = parseInt(poiId);

    // Check for duplicate ride request
    const existingRides = await DB.query('ride_requests', r =>
      r.group_id === activeGroup.id &&
      r.requester_id === currentUser.id &&
      r.passenger_type === passengerType &&
      r.passenger_id === passengerId &&
      r.direction === direction &&
      r.poi_id === selectedPoiId &&
      r.ride_date === rideDate &&
      r.status !== 'cancelled'
    );

    if (existingRides.length > 0) {
      alert('You have already requested an identical ride for this date. Please check your existing rides.');
      return;
    }

    await DB.create('ride_requests', {
      group_id: activeGroup.id,
      requester_id: currentUser.id,
      passenger_type: passengerType,
      passenger_id: passengerId,
      direction,
      poi_id: selectedPoiId,
      ride_date: rideDate,
      status: 'open',
      accepter_id: null,
      created_at: new Date().toISOString(),
      accepted_at: null,
      completed_at: null
    });

    refresh();
    setScreen('feed');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button
        onClick={() => setScreen('feed')}
        style={{
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '16px'
        }}
      >
        ← Back to Feed
      </button>

      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>
          Request a Ride
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
              Passenger
            </label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setPassengerType('parent')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: passengerType === 'parent' ? '#667eea' : 'white',
                  color: passengerType === 'parent' ? 'white' : '#4a5568',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Myself
              </button>
              <button
                type="button"
                onClick={() => setPassengerType('child')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: passengerType === 'child' ? '#667eea' : 'white',
                  color: passengerType === 'child' ? 'white' : '#4a5568',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                My Child
              </button>
            </div>

            {passengerType === 'child' && (
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                required
              >
                <option value="">Select a child</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
              Direction
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="home_to_poi">Home to Destination</option>
              <option value="poi_to_home">Destination to Home</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
              Destination
            </label>
            <select
              value={poiId}
              onChange={(e) => setPoiId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            >
              <option value="">Select destination</option>
              {pois.map(poi => (
                <option key={poi.id} value={poi.id}>{poi.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
              Date
            </label>
            <input
              type="date"
              value={rideDate}
              onChange={(e) => setRideDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Create Ride Request
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// GROUP SETTINGS SCREEN
// ============================================================================

function GroupSettingsScreen() {
  const { currentUser, activeGroup, setScreen } = useApp();
  const [members, setMembers] = useState([]);
  const { isMobile } = useWindowSize();

  useEffect(() => {
    loadMembers();
  }, [activeGroup]);

  const loadMembers = async () => {
    const memberships = await DB.query('group_members', m => m.group_id === activeGroup.id);
    const memberIds = memberships.map(m => m.user_id);
    const groupMembers = await DB.query('users', u => memberIds.includes(u.id));
    setMembers(groupMembers);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => setScreen('feed')}
        style={{
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '16px'
        }}
      >
        ← Back to Feed
      </button>

      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            {activeGroup.name}
          </h2>
          <p style={{ color: '#718096', fontSize: '14px', marginBottom: '0' }}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>

        <div style={{
          padding: '16px',
          background: '#fff5e1',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#744210',
          lineHeight: '1.5'
        }}>
          <strong>Privacy Notice:</strong> Phone numbers and home addresses shown below are visible to all members of this group.
        </div>

        <div style={{ 
          marginBottom: '12px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#718096',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Group Members
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {members.map(member => (
            <div
              key={member.id}
              style={{
                padding: '16px',
                background: member.id === currentUser.id ? '#edf2f7' : '#f7fafc',
                borderRadius: '8px',
                border: member.id === currentUser.id ? '2px solid #667eea' : 'none'
              }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a202c' }}>
                  {member.name}
                </div>
                {member.id === currentUser.id && (
                  <span style={{
                    padding: '4px 8px',
                    background: '#667eea',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    You
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Phone size={14} style={{ color: '#667eea', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#718096', marginBottom: '2px' }}>Phone</div>
                    <div style={{ fontSize: '14px', color: '#1a202c' }}>{member.phone}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={14} style={{ color: '#667eea', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#718096', marginBottom: '2px' }}>Address</div>
                    <AddressWithLink
                      address={member.home_address}
                      style={{ fontSize: '14px', color: '#1a202c' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#718096'
          }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p>No members in this group yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PROFILE SCREEN
// ============================================================================

function ProfileScreen() {
  const { currentUser, setCurrentUser, setScreen, refresh } = useApp();
  const [children, setChildren] = useState([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    home_address: currentUser.home_address
  });
  const { isMobile } = useWindowSize();

  useEffect(() => {
    loadChildren();
  }, [currentUser]);

  const loadChildren = async () => {
    const myChildren = await DB.query('children', c => c.parent_id === currentUser.id);
    setChildren(myChildren);
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!newChild.name) {
      alert('Child name is required');
      return;
    }

    await DB.create('children', {
      parent_id: currentUser.id,
      name: newChild.name,
      phone: newChild.phone || null
    });

    setNewChild({ name: '', phone: '' });
    setShowAddChild(false);
    loadChildren();
    refresh();
  };

  const handleDeleteChild = async (childId) => {
    if (window.confirm('Are you sure you want to remove this child?')) {
      await DB.delete('children', childId);
      loadChildren();
      refresh();
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileData.name || !profileData.phone || !profileData.home_address) {
      alert('All fields are required');
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: profileData.name,
      phone: profileData.phone,
      home_address: profileData.home_address
    };

    await DB.update('users', currentUser.id, updatedUser);
    setCurrentUser(updatedUser);
    setIsEditing(false);
    refresh();
  };

  const handleCancelEdit = () => {
    setProfileData({
      name: currentUser.name,
      phone: currentUser.phone,
      home_address: currentUser.home_address
    });
    setIsEditing(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button
        onClick={() => setScreen('groups')}
        style={{
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '16px'
        }}
      >
        ← Back to Groups
      </button>

      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', margin: 0 }}>
            My Profile
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '8px 16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#4a5568' }}>
                Name *
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#4a5568' }}>
                Email (Read-only)
              </label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: '#f7fafc',
                  color: '#718096'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#4a5568' }}>
                Phone *
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#4a5568' }}>
                Home Address *
              </label>
              <input
                type="text"
                value={profileData.home_address}
                onChange={(e) => setProfileData({...profileData, home_address: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#48bb78',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>Name</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a202c' }}>{currentUser.name}</div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>Email</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a202c' }}>{currentUser.email}</div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>Phone</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a202c' }}>{currentUser.phone}</div>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>Home Address</div>
              <AddressWithLink
                address={currentUser.home_address}
                style={{ fontSize: '16px', fontWeight: '500', color: '#1a202c' }}
              />
            </div>
          </>
        )}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', margin: 0 }}>
            My Children
          </h3>
          <button
            onClick={() => setShowAddChild(!showAddChild)}
            style={{
              padding: '8px 16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} />
            Add Child
          </button>
        </div>

        {showAddChild && (
          <form onSubmit={handleAddChild} style={{ marginBottom: '20px', padding: '20px', background: '#f7fafc', borderRadius: '8px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#4a5568' }}>
                Child's Name *
              </label>
              <input
                type="text"
                value={newChild.name}
                onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#4a5568' }}>
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={newChild.phone}
                onChange={(e) => setNewChild({...newChild, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#48bb78',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddChild(false);
                  setNewChild({ name: '', phone: '' });
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#cbd5e0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {children.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>
            No children added yet
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {children.map(child => (
              <div
                key={child.id}
                style={{
                  padding: '16px',
                  background: '#f7fafc',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a202c', marginBottom: '4px' }}>
                    {child.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#718096' }}>
                    {child.phone || 'No phone number'}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteChild(child.id)}
                  style={{
                    padding: '8px 12px',
                    background: '#fc8181',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// GROUP MEMBER MANAGER COMPONENT (for Admin)
// ============================================================================

function GroupMemberManager({ group, users, onUpdate }) {
  const { refresh } = useApp();
  const [members, setMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [group]);

  const loadMembers = async () => {
    const memberships = await DB.query('group_members', m => m.group_id === group.id);
    const memberIds = memberships.map(m => m.user_id);
    const groupMembers = await DB.query('users', u => memberIds.includes(u.id));
    setMembers(groupMembers);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (selectedUserId) {
      try {
        const userId = parseInt(selectedUserId);
        const exists = await DB.findOne('group_members', m => m.group_id === group.id && m.user_id === userId);
        if (exists) {
          alert('User is already in this group');
          return;
        }
        await DB.create('group_members', { group_id: group.id, user_id: userId });
        setSelectedUserId('');
        setShowAddMember(false);
        loadMembers();
        onUpdate();
        refresh();
      } catch (error) {
        console.error('Error adding member:', error);
        alert('Failed to add member: ' + error.message);
      }
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Remove this member from the group?')) {
      const membership = await DB.findOne('group_members', m => m.group_id === group.id && m.user_id === userId);
      if (membership) {
        await DB.delete('group_members', membership.id);
        loadMembers();
        onUpdate();
        refresh();
      }
    }
  };

  const availableUsers = users.filter(u => 
    u.is_approved && !members.some(m => m.id === u.id)
  );

  return (
    <div style={{ padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ fontWeight: '600', fontSize: '16px' }}>{group.name}</div>
        <button
          onClick={() => setShowMembers(!showMembers)}
          style={{
            padding: '6px 12px',
            background: 'white',
            color: '#4a5568',
            border: '2px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Users size={14} />
          {showMembers ? 'Hide' : 'Show'} Members ({members.length})
        </button>
      </div>

      {showMembers && (
        <div style={{ marginTop: '12px' }}>
          {members.length > 0 && (
            <div style={{ 
              marginBottom: '12px',
              padding: '12px',
              background: 'white',
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#718096', 
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>
                Current Members
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {members.map(member => (
                  <div 
                    key={member.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      background: '#f7fafc',
                      borderRadius: '6px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#718096' }}>
                        {member.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      style={{
                        padding: '6px 10px',
                        background: '#fc8181',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAddMember ? (
            <form onSubmit={handleAddMember} style={{
              padding: '12px',
              background: 'white',
              borderRadius: '8px'
            }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '12px', 
                fontWeight: '600',
                color: '#4a5568',
                textTransform: 'uppercase'
              }}>
                Add New Member
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '8px',
                  boxSizing: 'border-box'
                }}
                required
              >
                <option value="">Select a user to add</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Add Member
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedUserId('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#cbd5e0',
                    color: '#4a5568',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddMember(true)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} />
              Add Member
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADMIN SCREEN
// ============================================================================

function AdminScreen() {
  const { setScreen, refresh } = useApp();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pois, setPois] = useState([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddPOI, setShowAddPOI] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newPOI, setNewPOI] = useState({ name: '', address: '' });
  const [editingGroup, setEditingGroup] = useState(null);
  const { isMobile } = useWindowSize();
  const [editingPOI, setEditingPOI] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editPOIData, setEditPOIData] = useState({ name: '', address: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allUsers = await DB.query('users');
    setUsers(allUsers);

    const allGroups = await DB.query('groups');
    setGroups(allGroups);

    const allPois = await DB.query('pois');
    setPois(allPois);
  };

  const handleApproveUser = async (userId) => {
    await DB.update('users', userId, { is_approved: true });
    loadData();
    refresh();
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      await DB.create('groups', { name: newGroupName });
      setNewGroupName('');
      setShowAddGroup(false);
      loadData();
      refresh();
    }
  };

  const handleAddPOI = async (e) => {
    e.preventDefault();
    if (newPOI.name.trim() && newPOI.address.trim()) {
      await DB.create('pois', { name: newPOI.name, address: newPOI.address });
      setNewPOI({ name: '', address: '' });
      setShowAddPOI(false);
      loadData();
      refresh();
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group.id);
    setEditGroupName(group.name);
  };

  const handleSaveGroup = async (groupId) => {
    if (editGroupName.trim()) {
      const group = groups.find(g => g.id === groupId);
      await DB.update('groups', groupId, { ...group, name: editGroupName });
      setEditingGroup(null);
      setEditGroupName('');
      loadData();
      refresh();
    }
  };

  const handleArchiveGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to archive this group? It will be hidden from users but data will be preserved.')) {
      const group = groups.find(g => g.id === groupId);
      await DB.update('groups', groupId, { ...group, archived: true });
      loadData();
      refresh();
    }
  };

  const handleUnarchiveGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    await DB.update('groups', groupId, { ...group, archived: false });
    loadData();
    refresh();
  };

  const handleEditPOI = (poi) => {
    setEditingPOI(poi.id);
    setEditPOIData({ name: poi.name, address: poi.address });
  };

  const handleSavePOI = async (poiId) => {
    if (editPOIData.name.trim() && editPOIData.address.trim()) {
      const poi = pois.find(p => p.id === poiId);
      await DB.update('pois', poiId, { ...poi, name: editPOIData.name, address: editPOIData.address });
      setEditingPOI(null);
      setEditPOIData({ name: '', address: '' });
      loadData();
      refresh();
    }
  };

  const handleArchivePOI = async (poiId) => {
    if (window.confirm('Are you sure you want to archive this location? It will be hidden from users but data will be preserved.')) {
      const poi = pois.find(p => p.id === poiId);
      await DB.update('pois', poiId, { ...poi, archived: true });
      loadData();
      refresh();
    }
  };

  const handleUnarchivePOI = async (poiId) => {
    const poi = pois.find(p => p.id === poiId);
    await DB.update('pois', poiId, { ...poi, archived: false });
    loadData();
    refresh();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button
        onClick={() => setScreen('groups')}
        style={{
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '16px'
        }}
      >
        ← Back to Groups
      </button>

      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '20px' }}>
          Admin Panel
        </h2>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px', 
          borderBottom: '2px solid #e2e8f0',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {['users', 'groups', 'locations'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #667eea' : 'none',
                color: activeTab === tab ? '#667eea' : '#718096',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Pending Approvals</h3>
            {users.filter(u => !u.is_approved).length === 0 ? (
              <p style={{ color: '#718096', marginBottom: '24px' }}>No pending approvals</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                {users.filter(u => !u.is_approved).map(user => (
                  <div key={user.id} style={{ 
                    padding: '16px', 
                    background: '#f7fafc', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>{user.name}</div>
                      <div style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }}>{user.email}</div>
                    </div>
                    <button
                      onClick={() => handleApproveUser(user.id)}
                      style={{
                        padding: '10px 16px',
                        background: '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        width: '100%'
                      }}
                    >
                      Approve User
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>All Users</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {users.map(user => (
                <div key={user.id} style={{ 
                  padding: '12px', 
                  background: '#f7fafc', 
                  borderRadius: '6px', 
                  fontSize: '14px',
                  wordBreak: 'break-word'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{user.name}</div>
                  <div style={{ color: '#718096', fontSize: '13px' }}>
                    {user.email}
                    {user.is_admin && ' • Admin'}
                    {!user.is_approved && ' • Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setShowAddGroup(!showAddGroup)}
                style={{
                  padding: '12px 20px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} />
                {showAddGroup ? 'Cancel' : 'Add New Group'}
              </button>
            </div>

            {showAddGroup && (
              <form onSubmit={handleAddGroup} style={{ 
                marginBottom: '20px', 
                padding: '16px', 
                background: '#f7fafc', 
                borderRadius: '8px' 
              }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#4a5568' }}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Soccer Practice"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    marginBottom: '12px'
                  }}
                  required
                />
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Create Group
                </button>
              </form>
            )}

            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Active Groups</h3>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
              {groups.filter(g => !g.archived).map(group => (
                <div key={group.id} style={{
                  padding: '16px',
                  background: '#f7fafc',
                  borderRadius: '8px'
                }}>
                  {editingGroup === group.id ? (
                    <div>
                      <input
                        type="text"
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          marginBottom: '12px'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleSaveGroup(group.id)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: '#48bb78',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingGroup(null)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: '#e2e8f0',
                            color: '#4a5568',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '16px' }}>{group.name}</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEditGroup(group)}
                            style={{
                              padding: '6px 12px',
                              background: '#667eea',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleArchiveGroup(group.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#ed8936',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                      <GroupMemberManager group={group} users={users} onUpdate={loadData} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {groups.filter(g => g.archived).length > 0 && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#718096' }}>Archived Groups</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {groups.filter(g => g.archived).map(group => (
                    <div key={group.id} style={{
                      padding: '16px',
                      background: '#f7fafc',
                      borderRadius: '8px',
                      opacity: 0.7
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '16px', color: '#718096' }}>{group.name}</div>
                        <button
                          onClick={() => handleUnarchiveGroup(group.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#48bb78',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          Unarchive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'locations' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setShowAddPOI(!showAddPOI)}
                style={{
                  padding: '12px 20px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} />
                {showAddPOI ? 'Cancel' : 'Add New Location'}
              </button>
            </div>

            {showAddPOI && (
              <form onSubmit={handleAddPOI} style={{ 
                marginBottom: '20px', 
                padding: '16px', 
                background: '#f7fafc', 
                borderRadius: '8px' 
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#4a5568' }}>
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={newPOI.name}
                    onChange={(e) => setNewPOI({...newPOI, name: e.target.value})}
                    placeholder="e.g., Community Center"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#4a5568' }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={newPOI.address}
                    onChange={(e) => setNewPOI({...newPOI, address: e.target.value})}
                    placeholder="123 Main St, Haworth, NJ"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Create Location
                </button>
              </form>
            )}

            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Active Locations</h3>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
              {pois.filter(p => !p.archived).map(poi => (
                <div key={poi.id} style={{
                  padding: '16px',
                  background: '#f7fafc',
                  borderRadius: '8px'
                }}>
                  {editingPOI === poi.id ? (
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#4a5568' }}>
                          Location Name
                        </label>
                        <input
                          type="text"
                          value={editPOIData.name}
                          onChange={(e) => setEditPOIData({...editPOIData, name: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#4a5568' }}>
                          Address
                        </label>
                        <input
                          type="text"
                          value={editPOIData.address}
                          onChange={(e) => setEditPOIData({...editPOIData, address: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleSavePOI(poi.id)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: '#48bb78',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPOI(null)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: '#e2e8f0',
                            color: '#4a5568',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>{poi.name}</div>
                          <AddressWithLink
                            address={poi.address}
                            style={{ fontSize: '14px', color: '#718096' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                          <button
                            onClick={() => handleEditPOI(poi)}
                            style={{
                              padding: '6px 12px',
                              background: '#667eea',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleArchivePOI(poi.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#ed8936',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pois.filter(p => p.archived).length > 0 && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#718096' }}>Archived Locations</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {pois.filter(p => p.archived).map(poi => (
                    <div key={poi.id} style={{
                      padding: '16px',
                      background: '#f7fafc',
                      borderRadius: '8px',
                      opacity: 0.7
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px', color: '#718096' }}>{poi.name}</div>
                          <AddressWithLink
                            address={poi.address}
                            style={{ fontSize: '14px', color: '#718096' }}
                          />
                        </div>
                        <button
                          onClick={() => handleUnarchivePOI(poi.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#48bb78',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            flexShrink: 0,
                            marginLeft: '12px'
                          }}
                        >
                          Unarchive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}