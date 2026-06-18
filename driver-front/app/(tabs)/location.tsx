import { View, Text, StyleSheet, Pressable, Alert, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import { useDriverData } from '@/hooks/useDriverData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Wifi, WifiOff, RefreshCw, Target, Activity } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Location() {
  const { theme } = useTheme();
  const { location, requestLocation, loading: locationLoading } = useLocation();
  const { bus, updateBusLocation } = useDriverData();
  const { t } = useLanguage();
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (location && isTracking && bus) {
      handleLocationUpdate();
    }
  }, [location, isTracking, bus]);

  // Auto-start tracking when bus goes online
  useEffect(() => {
    if (bus && bus.isOnline && location && !isTracking) {
      setIsTracking(true);
      handleLocationUpdate();
    } else if (bus && !bus.isOnline && isTracking) {
      setIsTracking(false);
    }
  }, [bus?.isOnline, location]);

  const handleLocationUpdate = async () => {
    if (!location || !bus) return;

    const success = await updateBusLocation(
      location.latitude,
      location.longitude,
      0, // speed
      0, // heading
      location.accuracy || 0
    );

    if (success) {
      setLastUpdate(new Date());
    }
  };

  const toggleTracking = async () => {
    if (!bus) {
      Alert.alert(t('common.error'), t('bus.no.assigned'));
      return;
    }

    if (!location) {
      Alert.alert(t('location.title'), t('location.enable.services'));
      await requestLocation();
      return;
    }

    setIsTracking(!isTracking);

    if (!isTracking) {
      // Start tracking
      await handleLocationUpdate();
      Alert.alert(t('location.tracking.started'), t('location.sharing.enabled'));
    } else {
      Alert.alert(t('location.tracking.stopped'), t('location.sharing.disabled'));
    }
  };

  const refreshLocation = async () => {
    await requestLocation();
    if (isTracking) {
      await handleLocationUpdate();
    }
  };

  const isDark = theme.background === '#0F172A' || theme.background === '#1a1a2e';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('location.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t('location.subtitle')}
            </Text>
          </View>

          <Pressable
            style={[styles.refreshButton, { backgroundColor: theme.primary + '20' }]}
            onPress={refreshLocation}
            disabled={locationLoading}
          >
            <RefreshCw
              size={20}
              color={theme.primary}
              style={{ transform: [{ rotate: locationLoading ? '180deg' : '0deg' }] }}
            />
          </Pressable>
        </View>

        {/* Status Cards */}
        <View style={styles.statusSection}>
          <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.statusIcon, { backgroundColor: isTracking ? '#4CAF50' + '15' : '#d90429' + '15' }]}>
              {isTracking ? (
                <Wifi size={24} color="#4CAF50" />
              ) : (
                <WifiOff size={24} color="#d90429" />
              )}
            </View>
            <View style={styles.statusContent}>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
                {t('location.tracking.status')}
              </Text>
              <Text style={[styles.statusValue, { color: isTracking ? '#4CAF50' : '#d90429' }]}>
                {isTracking ? t('location.status.active') : t('location.status.inactive')}
              </Text>
            </View>
          </View>

          <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.statusIcon, { backgroundColor: theme.primary + '15' }]}>
              <MapPin size={24} color={theme.primary} />
            </View>
            <View style={styles.statusContent}>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
                {t('location.current.location')}
              </Text>
              <Text style={[styles.statusValue, { color: location ? '#4CAF50' : '#d90429' }]}>
                {location ? t('location.status.available') : t('location.status.unavailable')}
              </Text>
            </View>
          </View>

          <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.statusIcon, { backgroundColor: '#d90429' + '15' }]}>
              <Clock size={24} color="#d90429" />
            </View>
            <View style={styles.statusContent}>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
                {t('location.last.update')}
              </Text>
              <Text style={[styles.statusValue, { color: theme.text }]}>
                {lastUpdate ? lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('location.never')}
              </Text>
            </View>
          </View>
        </View>

        {/* Map Section */}
        <View style={[styles.mapSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.primary + '15' }]}>
              <Target size={20} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('location.current.location')}
            </Text>
          </View>

          {location ? (
            <View style={styles.mapContainer}>
              <WebView
                source={{ html: `
<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body,#map{width:100%;height:100vh;}.bus-icon{background:${theme.primary};color:#fff;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);}.user-dot{width:16px;height:16px;border-radius:50%;background:#4285f4;border:3px solid #fff;box-shadow:0 2px 8px rgba(66,133,244,0.6);}</style>
</head><body><div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true}).setView([${location.latitude},${location.longitude}],16);
L.tileLayer('${tileUrl}',{attribution:'&copy; OpenStreetMap',maxZoom:19,subdomains:'abcd'}).addTo(map);
var uIcon=L.divIcon({className:'',html:'<div class="user-dot"></div>',iconSize:[16,16],iconAnchor:[8,8]});
L.marker([${location.latitude},${location.longitude}],{icon:uIcon}).addTo(map).bindPopup('<b>🚌 ${bus?.plateNumber || 'Your Bus'}</b><br>You are here').openPopup();
</script></body></html>` }}
                style={styles.map}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
              />
            </View>
          ) : (
            <View style={[styles.noLocationContainer, { backgroundColor: theme.background }]}>
              <View style={[styles.noLocationIcon, { backgroundColor: theme.textSecondary + '15' }]}>
                <MapPin size={40} color={theme.textSecondary} />
              </View>
              <Text style={[styles.noLocationText, { color: theme.textSecondary }]}>
                {t('location.not.available')}
              </Text>
              <Text style={[styles.noLocationSubtext, { color: theme.textSecondary }]}>
                {t('location.enable.services')}
              </Text>
            </View>
          )}
        </View>

        {/* Location Details */}
        {location && (
          <View style={[styles.locationDetails, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#9C27B0' + '15' }]}>
                <Activity size={20} color="#9C27B0" />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t('location.details')}
              </Text>
            </View>

            <View style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  {t('location.latitude')}
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {location.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  {t('location.longitude')}
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {location.longitude.toFixed(6)}
                </Text>
              </View>
              {location.accuracy && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    {t('location.accuracy')}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    ±{Math.round(location.accuracy)}m
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Control Button */}
        <View style={styles.controlSection}>
          <Pressable
            style={[
              styles.trackingButton,
              { backgroundColor: isTracking ? '#d90429' : '#4CAF50' }
            ]}
            onPress={toggleTracking}
          >
            <Navigation size={20} color="#FFFFFF" />
            <Text style={styles.trackingButtonText}>
              {isTracking ? t('location.stop.tracking') : t('location.start.tracking')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  refreshButton: {
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  mapSection: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  mapContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    height: 200,
  },
  noLocationContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  noLocationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noLocationText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  noLocationSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  busMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  busMarkerText: {
    fontSize: 16,
  },
  locationDetails: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  detailsContent: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  controlSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});