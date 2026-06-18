import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import { 
  FileText, 
  Bus, 
  Users, 
  UserCircle,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function LogsAndReports() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'buses' | 'passengers' | 'drivers'>('buses');
  const [loading, setLoading] = useState(false);

  // Data states
  const [schedules, setSchedules] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'buses') {
        const response = await apiService.getBusSchedules();
        setSchedules(response.schedules || []);
      } else if (activeTab === 'passengers') {
        const response = await apiService.getUserInterests();
        setInterests(response.interests || []);
      } else if (activeTab === 'drivers') {
        const response = await apiService.getAllBusLocations();
        setLocations(response.buses || []);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} logs:`, error);
    } finally {
      setLoading(false);
    }
  };

  const renderBusLogs = () => (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Date / Time</th>
            <th>Bus Plate</th>
            <th>Route</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {schedules.slice(0, 50).map((schedule) => (
            <tr key={schedule._id}>
              <td>
                  <div className="flex flex-col">
                    <span className="font-medium" style={{ color: theme.text }}>
                      {new Date(schedule.createdAt || schedule.departureTime).toLocaleDateString()}
                    </span>
                    <span className="text-xs" style={{ color: theme.textSecondary }}>
                      {new Date(schedule.createdAt || schedule.departureTime).toLocaleTimeString()}
                    </span>
                  </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Bus size={16} style={{ color: theme.primary }} />
                  <span style={{ color: theme.text }} className="font-medium">
                    {schedule.busId?.plateNumber || 'Unknown'}
                  </span>
                </div>
              </td>
              <td>
                <span style={{ color: theme.text }}>
                  {schedule.routeId?.name || 'Unknown Route'}
                </span>
              </td>
              <td>
                <span className={`admin-badge`} style={{
                  backgroundColor: schedule.status === 'completed' ? `${theme.success}20` : 
                                  schedule.status === 'in-transit' ? `${theme.primary}20` : `${theme.warning}20`,
                  color: schedule.status === 'completed' ? theme.success : 
                         schedule.status === 'in-transit' ? theme.primary : theme.warning
                }}>
                  {schedule.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </td>
            </tr>
          ))}
          {schedules.length === 0 && !loading && (
            <tr>
              <td colSpan={4} className="py-8 text-center" style={{ color: theme.textSecondary }}>
                No bus activity logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderPassengerLogs = () => (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Passenger</th>
            <th>Pickup Point</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {interests.slice(0, 50).map((interest) => (
            <tr key={interest._id}>
              <td>
                  <div className="flex flex-col">
                    <span className="font-medium" style={{ color: theme.text }}>
                      {new Date(interest.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs" style={{ color: theme.textSecondary }}>
                      {new Date(interest.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Users size={16} style={{ color: theme.secondary }} />
                  <span style={{ color: theme.text }} className="font-medium">
                    {interest.userId?.name || 'Unknown User'}
                  </span>
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <MapPin size={16} style={{ color: theme.textSecondary }} />
                  <span style={{ color: theme.text }}>
                    {interest.pickupPointId?.name || 'Unknown Location'}
                  </span>
                </div>
              </td>
              <td>
                <div className="flex items-center gap-1.5">
                  {interest.status === 'confirmed' ? (
                    <CheckCircle size={16} style={{ color: theme.success }} />
                  ) : interest.status === 'cancelled' ? (
                    <XCircle size={16} style={{ color: theme.error }} />
                  ) : (
                    <Clock size={16} style={{ color: theme.warning }} />
                  )}
                  <span className="text-sm font-medium" style={{
                    color: interest.status === 'confirmed' ? theme.success : 
                           interest.status === 'cancelled' ? theme.error : theme.warning
                  }}>
                    {interest.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </td>
            </tr>
            ))}
          {interests.length === 0 && !loading && (
            <tr>
              <td colSpan={4} className="py-8 text-center" style={{ color: theme.textSecondary }}>
                No passenger activity logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderDriverLogs = () => (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Driver / Bus</th>
            <th>Status</th>
            <th>Last Seen</th>
            <th>Current Speed</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.id}>
              <td>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <UserCircle size={16} style={{ color: theme.primary }} />
                      <span className="font-medium" style={{ color: theme.text }}>
                        {loc.driver?.name || 'Unknown Driver'}
                      </span>
                    </div>
                    <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                      Bus Plate: {loc.plateNumber || 'N/A'}
                    </span>
                  </div>
              </td>
              <td>
                <span className={`admin-badge`} style={{
                  backgroundColor: loc.isOnline ? `${theme.success}20` : `${theme.textSecondary}20`,
                  color: loc.isOnline ? theme.success : theme.textSecondary
                }}>
                  {loc.isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </td>
              <td>
                <div className="flex flex-col">
                  <span style={{ color: theme.text }}>
                    {loc.lastSeen ? new Date(loc.lastSeen).toLocaleDateString() : 'Never'}
                  </span>
                  <span className="text-xs" style={{ color: theme.textSecondary }}>
                    {loc.lastSeen ? new Date(loc.lastSeen).toLocaleTimeString() : '-'}
                  </span>
                </div>
              </td>
              <td>
                <span style={{ color: theme.text }}>
                  {loc.currentLocation?.speed ? `${Math.round(loc.currentLocation.speed)} km/h` : '0 km/h'}
                </span>
              </td>
            </tr>
            ))}
          {locations.length === 0 && !loading && (
            <tr>
              <td colSpan={4} className="py-8 text-center" style={{ color: theme.textSecondary }}>
                No driver activity logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="admin-page-container fade-in">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-section">
          <h1 className="admin-page-title">Logs & Reports</h1>
          <p className="admin-page-subtitle">Track real-time activities across buses, passengers, and drivers.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-filters">
        <div className="admin-filters-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <button
            onClick={() => setActiveTab('buses')}
            className={`admin-btn ${activeTab === 'buses' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={activeTab === 'buses' ? {} : { backgroundColor: 'white' }}
          >
            <Bus size={18} />
            Bus Activities
          </button>
          <button
            onClick={() => setActiveTab('passengers')}
            className={`admin-btn ${activeTab === 'passengers' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={activeTab === 'passengers' ? {} : { backgroundColor: 'white' }}
          >
            <Users size={18} />
            Passenger Interests
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`admin-btn ${activeTab === 'drivers' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={activeTab === 'drivers' ? {} : { backgroundColor: 'white' }}
          >
            <UserCircle size={18} />
            Driver Status
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      ) : (
        /* Content */
        <div className="fade-in">
          {activeTab === 'buses' && renderBusLogs()}
          {activeTab === 'passengers' && renderPassengerLogs()}
          {activeTab === 'drivers' && renderDriverLogs()}
        </div>
      )}
    </div>
  );
}
