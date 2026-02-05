import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Users, MapPin, Calendar, Plus, Home, ArrowRight, Check, X, Settings, LogOut, ChevronDown, Phone, Clock, CheckCircle } from 'lucide-react';

// ============================================================================
// STORAGE LAYER - Simulates backend with localStorage
// ============================================================================

const DB = {
  async init() {
    if (!localStorage.getItem('carpool_db')) {
      const initialData = {
        users: [
          { id: 1, email: 'admin@haworth.com', password: 'admin123', name: 'Admin User', phone: '201-555-0100', home_address: '123 Main St, Haworth, NJ', is_approved: true, is_admin: true },
          { id: 2, email: 'sarah@email.com', password: 'pass123', name: 'Sarah Cohen', phone: '201-555-0101', home_address: '45 Oak Ave, Haworth, NJ', is_approved: true, is_admin: false },
          { id: 3, email: 'michael@email.com', password: 'pass123', name: 'Michael Chen', phone: '201-555-0102', home_address: '67 Maple Dr, Haworth, NJ', is_approved: true, is_admin: false },
          { id: 4, email: 'jessica@email.com', password: 'pass123', name: 'Jessica Williams', phone: '201-555-0103', home_address: '89 Pine Ln, Haworth, NJ', is_approved: true, is_admin: false }
        ],
        children: [
          { id: 1, parent_id: 2, name: 'Emma Cohen', phone: '201-555-0201' },
          { id: 2, parent_id: 2, name: 'Noah Cohen', phone: null },
          { id: 3, parent_id: 3, name: 'Olivia Chen', phone: '201-555-0202' },
          { id: 4, parent_id: 4, name: 'Liam Williams', phone: '201-555-0203' }
        ],
        pois: [
          { id: 1, name: 'Israeli Scouts Meeting Hall', address: '100 Scout Way, Haworth, NJ' },
          { id: 2, name: 'Haworth Tennis Courts', address: '200 Tennis Rd, Haworth, NJ' },
          { id: 3, name: 'Community Center', address: '300 Center St, Haworth, NJ' },
          { id: 4, name: 'Haworth School', address: '400 School Ave, Haworth, NJ' }
        ],
        groups: [
          { id: 1, name: 'Israeli Scouts' },
          { id: 2, name: 'Monday Night Tennis' },
          { id: 3, name: 'School Carpool' }
        ],
        group_members: [
          { id: 1, group_id: 1, user_id: 2 },
          { id: 2, group_id: 1, user_id: 3 },
          { id: 3, group_id: 2, user_id: 2 },
          { id: 4, group_id: 2, user_id: 4 },
          { id: 5, group_id: 3, user_id: 3 },
          { id: 6, group_id: 3, user_id: 4 }
        ],
        ride_requests: [
          { 
            id: 1, 
            group_id: 1, 
            requester_id: 2, 
            passenger_type: 'child', 
            passenger_id: 1, 
            direction: 'home_to_poi', 
            poi_id: 1, 
            ride_date: new Date().toISOString().split('T')[0],
            status: 'open',
            accepter_id: null,
            created_at: new Date().toISOString(),
            accepted_at: null,
            completed_at: null
          },
          { 
            id: 2, 
            group_id: 1, 
            requester_id: 3, 
            passenger_type: 'child', 
            passenger_id: 3, 
            direction: 'poi_to_home', 
            poi_id: 1, 
            ride_date: new Date().toISOString().split('T')[0],
            status: 'open',
            accepter_id: null,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            accepted_at: null,
            completed_at: null
          },
          { 
            id: 3, 
            group_id: 1, 
            requester_id: 2, 
            passenger_type: 'child', 
            passenger_id: 2, 
            direction: 'home_to_poi', 
            poi_id: 1, 
            ride_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            status: 'open',
            accepter_id: null,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            accepted_at: null,
            completed_at: null
          },
          { 
            id: 4, 
            group_id: 2, 
            requester_id: 2, 
            passenger_type: 'parent', 
            passenger_id: 2, 
            direction: 'home_to_poi', 
            poi_id: 2, 
            ride_date: new Date().toISOString().split('T')[0],
            status: 'accepted',
            accepter_id: 4,
            created_at: new Date(Date.now() - 10800000).toISOString(),
            accepted_at: new Date(Date.now() - 3600000).toISOString(),
            completed_at: null
          },
          { 
            id: 5, 
            group_id: 2, 
            requester_id: 4, 
            passenger_type: 'child', 
            passenger_id: 4, 
            direction: 'poi_to_home', 
            poi_id: 2, 
            ride_date: new Date().toISOString().split('T')[0],
            status: 'accepted',
            accepter_id: 2,
            created_at: new Date(Date.now() - 14400000).toISOString(),
            accepted_at: new Date(Date.now() - 7200000).toISOString(),
            completed_at: null
          },
          { 
            id: 6, 
            group_id: 3, 
            requester_id: 3, 
            passenger_type: 'child', 
            passenger_id: 3, 
            direction: 'home_to_poi', 
            poi_id: 4, 
            ride_date: new Date().toISOString().split('T')[0],
            status: 'open',
            accepter_id: null,
            created_at: new Date(Date.now() - 1800000).toISOString(),
            accepted_at: null,
            completed_at: null
          },
          { 
            id: 7, 
            group_id: 3, 
            requester_id: 4, 
            passenger_type: 'child', 
            passenger_id: 4, 
            direction: 'home_to_poi', 
            poi_id: 4, 
            ride_date: new Date().toISOString().split('T')[0],
            status: 'open',
            accepter_id: null,
            created_at: new Date(Date.now() - 5400000).toISOString(),
            accepted_at: null,
            completed_at: null
          },
          { 
            id: 8, 
            group_id: 1, 
            requester_id: 2, 
            passenger_type: 'child', 
            passenger_id: 1, 
            direction: 'poi_to_home', 
            poi_id: 1, 
            ride_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            status: 'open',
            accepter_id: null,
            created_at: new Date(Date.now() - 900000).toISOString(),
            accepted_at: null,
            completed_at: null
          },
          { 
            id: 9, 
            group_id: 2, 
            requester_id: 2, 
            passenger_type: 'parent', 
            passenger_id: 2, 
            direction: 'poi_to_home', 
            poi_id: 2, 
            ride_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            status: 'open',
            accepter_id: null,
            created_at: new Date(Date.now() - 21600000).toISOString(),
            accepted_at: null,
            completed_at: null
          },
          { 
            id: 10, 
            group_id: 3, 
            requester_id: 4, 
            passenger_type: 'child', 
            passenger_id: 4, 
            direction: 'poi_to_home', 
            poi_id: 4, 
            ride_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            status: 'completed',
            accepter_id: 3,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            accepted_at: new Date(Date.now() - 82800000).toISOString(),
            completed_at: new Date(Date.now() - 79200000).toISOString()
          },
          { 
            id: 11, 
            group_id: 1, 
            requester_id: 3, 
            passenger_type: 'parent', 
            passenger_id: 3, 
            direction: 'home_to_poi', 
            poi_id: 1, 
            ride_date: new Date().toISOString().split('T')[0],
            status: 'accepted',
            accepter_id: 2,
            created_at: new Date(Date.now() - 18000000).toISOString(),
            accepted_at: new Date(Date.now() - 14400000).toISOString(),
            completed_at: null
          },
          { 
            id: 12, 
            group_id: 2, 
            requester_id: 4, 
            passenger_type: 'parent', 
            passenger_id: 4, 
            direction: 'home_to_poi', 
            poi_id: 2, 
            ride_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            status: 'open',
            accepter_id: null,
            created_at: new Date(Date.now() - 25200000).toISOString(),
            accepted_at: null,
            completed_at: null
          },
          { 
            id: 13, 
            group_id: 3, 
            requester_id: 3, 
            passenger_type: 'child', 
            passenger_id: 3, 
            direction: 'poi_to_home', 
            poi_id: 4, 
            ride_date: new Date().toISOString().split('T')[0],
            status: 'cancelled',
            accepter_id: null,
            created_at: new Date(Date.now() - 32400000).toISOString(),
            accepted_at: null,
            completed_at: null
          }
        ],
        next_id: {
          users: 5,
          children: 5,
          pois: 5,
          groups: 4,
          group_members: 7,
          ride_requests: 14
        }
      };
      localStorage.setItem('carpool_db', JSON.stringify(initialData));
    }
  },

  async getData() {
    const data = localStorage.getItem('carpool_db');
    return JSON.parse(data);
  },

  async saveData(data) {
    localStorage.setItem('carpool_db', JSON.stringify(data));
  },

  async query(table, filter = null) {
    const data = await this.getData();
    let results = data[table] || [];
    if (filter) {
      results = results.filter(filter);
    }
    return results;
  },

  async findOne(table, filter) {
    const results = await this.query(table, filter);
    return results[0] || null;
  },

  async create(table, record) {
    const data = await this.getData();
    const id = data.next_id[table];
    const newRecord = { ...record, id };
    data[table].push(newRecord);
    data.next_id[table] = id + 1;
    await this.saveData(data);
    return newRecord;
  },

  async update(table, id, updates) {
    const data = await this.getData();
    const index = data[table].findIndex(r => r.id === id);
    if (index !== -1) {
      data[table][index] = { ...data[table][index], ...updates };
      await this.saveData(data);
      return data[table][index];
    }
    return null;
  },

  async delete(table, id) {
    const data = await this.getData();
    data[table] = data[table].filter(r => r.id !== id);
    await this.saveData(data);
  }
};

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

  useEffect(() => {
    DB.init();
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

  return (
    <AppContext.Provider value={contextValue}>
      <div style={{ 
        minHeight: '100vh',
        background: '#f6f6f6',
        fontFamily: '"UberMove", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const user = await DB.findOne('users', u => u.email === email && u.password === password);
    
    if (!user) {
      setError('Invalid email or password');
      return;
    }

    if (!user.is_approved) {
      setError('Your account is pending approval');
      return;
    }

    setCurrentUser(user);
    setScreen('groups');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !signupData.name || !signupData.phone || !signupData.home_address) {
      setError('All fields are required');
      return;
    }

    const existingUser = await DB.findOne('users', u => u.email === email);
    if (existingUser) {
      setError('Email already registered');
      return;
    }

    await DB.create('users', {
      email,
      password,
      name: signupData.name,
      phone: signupData.phone,
      home_address: signupData.home_address,
      is_approved: false,
      is_admin: false
    });

    setError('');
    alert('Account created! Please wait for admin approval.');
    setIsSignup(false);
    setEmail('');
    setPassword('');
    setSignupData({ name: '', phone: '', home_address: '' });
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      background: '#000'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '48px 40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '36px',
          fontWeight: '700',
          color: '#000',
          letterSpacing: '-0.5px'
        }}>
          Haworthians
        </h1>
        <p style={{ 
          margin: '0 0 40px 0',
          color: '#545454',
          fontSize: '16px',
          fontWeight: '400'
        }}>
          {isSignup ? 'Create your account' : 'Sign in to continue'}
        </p>

        <form onSubmit={isSignup ? handleSignup : handleLogin}>
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

        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: '#f6f6f6',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#545454',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: '#000' }}>Demo accounts:</strong><br />
          admin@haworth.com / admin123<br />
          sarah@email.com / pass123
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

function MainApp() {
  const { currentUser, screen, setScreen, activeGroup } = useApp();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: '20px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {screen === 'groups' && <GroupsScreen />}
        {screen === 'feed' && activeGroup && <FeedScreen />}
        {screen === 'create_ride' && activeGroup && <CreateRideScreen />}
        {screen === 'group_settings' && activeGroup && <GroupSettingsScreen />}
        {screen === 'profile' && <ProfileScreen />}
        {screen === 'admin' && currentUser.is_admin && <AdminScreen />}
      </div>
    </div>
  );
}

// ============================================================================
// HEADER
// ============================================================================

function Header() {
  const { currentUser, setCurrentUser, setScreen, activeGroup, setActiveGroup } = useApp();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveGroup(null);
    setScreen('login');
  };

  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #e0e0e0',
      padding: '16px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
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
            fontSize: '20px',
            fontWeight: '700',
            color: '#000',
            cursor: 'pointer',
            padding: 0,
            whiteSpace: 'nowrap',
            letterSpacing: '-0.5px'
          }}
        >
          Haworthians
        </button>
        {activeGroup && (
          <>
            <span style={{ color: '#c0c0c0', flexShrink: 0 }}>/</span>
            <span style={{ 
              fontSize: '16px', 
              color: '#545454', 
              fontWeight: '400',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
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
            padding: '10px 16px',
            background: '#f6f6f6',
            border: 'none',
            borderRadius: '100px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#000',
            maxWidth: '180px'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
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
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'inline-block',
            maxWidth: '100px'
          }}>
            {currentUser.name}
          </span>
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
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              minWidth: '200px',
              zIndex: 100,
              overflow: 'hidden'
            }}>
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

              <button
                onClick={handleLogout}
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
                <LogOut size={18} />
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

  useEffect(() => {
    loadGroups();
  }, [currentUser, refreshKey]);

  const loadGroups = async () => {
    const memberships = await DB.query('group_members', m => m.user_id === currentUser.id);
    const groupIds = memberships.map(m => m.group_id);
    const userGroups = await DB.query('groups', g => groupIds.includes(g.id));
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
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    loadRides();
  }, [activeGroup, refreshKey, filter]);

  const loadRides = async () => {
    let rideRequests = await DB.query('ride_requests', r => r.group_id === activeGroup.id);
    
    if (filter === 'open') {
      rideRequests = rideRequests.filter(r => r.status === 'open');
    } else if (filter === 'mine') {
      rideRequests = rideRequests.filter(r => r.requester_id === currentUser.id);
    } else if (filter === 'accepted') {
      rideRequests = rideRequests.filter(r => 
        r.accepter_id === currentUser.id && (r.status === 'accepted' || r.status === 'completed')
      );
    }

    // Sort by date and created time
    rideRequests.sort((a, b) => {
      if (a.ride_date !== b.ride_date) {
        return new Date(a.ride_date) - new Date(b.ride_date);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setRides(rideRequests);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#000', margin: '0 0 20px 0', letterSpacing: '-0.5px' }}>
          Rides
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setScreen('create_ride')}
            style={{
              padding: '14px 24px',
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: '1 1 auto',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#333'}
            onMouseLeave={(e) => e.target.style.background = '#000'}
          >
            <Plus size={18} />
            Request Ride
          </button>
          <button
            onClick={() => setScreen('group_settings')}
            style={{
              padding: '14px 24px',
              background: 'white',
              color: '#000',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: '1 1 auto',
              justifyContent: 'center',
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
            <Settings size={18} />
            Group Info
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
              padding: '10px 20px',
              background: filter === f.key ? '#000' : 'white',
              color: filter === f.key ? 'white' : '#545454',
              border: filter === f.key ? 'none' : '1px solid #e0e0e0',
              borderRadius: '100px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              flex: '1 1 auto',
              minWidth: 'fit-content',
              transition: 'all 0.2s'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rides.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '48px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#545454',
          border: '1px solid #e0e0e0'
        }}>
          <MapPin size={56} style={{ margin: '0 auto 20px', opacity: 0.3, color: '#000' }} />
          <p style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#000', fontWeight: '500' }}>No rides found</p>
          <p style={{ fontSize: '14px', margin: 0 }}>Be the first to request a ride</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {rides.map(ride => (
            <RideCard key={ride.id} ride={ride} onUpdate={loadRides} />
          ))}
        </div>
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
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #e0e0e0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
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
          <div style={{ fontSize: '13px', color: '#545454', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {poi.address}
          </div>
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
              <div style={{ fontSize: '13px', color: '#545454' }}>{requester.home_address}</div>
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const myChildren = await DB.query('children', c => c.parent_id === currentUser.id);
    setChildren(myChildren);

    const allPois = await DB.query('pois');
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

    await DB.create('ride_requests', {
      group_id: activeGroup.id,
      requester_id: currentUser.id,
      passenger_type: passengerType,
      passenger_id: passengerType === 'parent' ? currentUser.id : parseInt(childId),
      direction,
      poi_id: parseInt(poiId),
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
                  <div>
                    <div style={{ fontSize: '11px', color: '#718096', marginBottom: '2px' }}>Address</div>
                    <div style={{ fontSize: '14px', color: '#1a202c' }}>{member.home_address}</div>
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
  const { currentUser, setScreen, refresh } = useApp();
  const [children, setChildren] = useState([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', phone: '' });

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
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>
          My Profile
        </h2>

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
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a202c' }}>{currentUser.home_address}</div>
        </div>
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

            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>All Groups</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {groups.map(group => (
                <GroupMemberManager key={group.id} group={group} users={users} onUpdate={loadData} />
              ))}
            </div>
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

            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>All Locations</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {pois.map(poi => (
                <div key={poi.id} style={{ padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>{poi.name}</div>
                  <div style={{ fontSize: '14px', color: '#718096' }}>{poi.address}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}