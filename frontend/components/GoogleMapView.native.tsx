import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import { useTheme } from '@/contexts/ThemeContext';
import { Bus } from '@/types/bus';

interface GoogleMapViewProps {
  buses: Bus[];
  userLocation?: { latitude: number; longitude: number };
  onBusPress?: (bus: Bus) => void;
}

// Default centre: Kigali, Rwanda
const DEFAULT_LAT = -1.9441;
const DEFAULT_LNG = 30.0619;

export function GoogleMapView({ buses, userLocation, onBusPress }: GoogleMapViewProps) {
  const { theme } = useTheme();
  const webviewRef = useRef<WebView>(null);

  const lat = userLocation?.latitude ?? DEFAULT_LAT;
  const lng = userLocation?.longitude ?? DEFAULT_LNG;

  // Serialise bus data for the WebView (only buses with valid coords)
  const busData = useMemo(() =>
    buses
      .filter(b => b.currentLocation?.latitude != null && b.currentLocation?.longitude != null)
      .map(b => ({
        id: b.id,
        lat: b.currentLocation.latitude,
        lng: b.currentLocation.longitude,
        route: b.route || '',
        plateNumber: b.plateNumber || '',
        eta: b.eta ?? 0,
        destination: b.destination || '',
        isActive: b.isActive,
      })),
    [buses]
  );

  // When user location changes, pan the map
  useEffect(() => {
    if (userLocation && webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `if(window.map){ window.map.setView([${userLocation.latitude}, ${userLocation.longitude}], window.map.getZoom()); } true;`
      );
    }
  }, [userLocation]);

  const isDark = theme.background === '#0F172A' || theme.background === '#1a1a2e';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttrib = isDark
    ? '&copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100vh; background:${theme.surface}; }
    .bus-pill {
      background: ${theme.primary};
      color: #fff;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      white-space: nowrap;
      cursor: pointer;
    }
    .bus-pill.inactive { background: #888; }
    .user-dot {
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #4285f4;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(66,133,244,0.6);
    }
    .leaflet-popup-content-wrapper { border-radius: 12px; }
    .popup-title { font-weight:700; font-size:13px; margin-bottom:4px; }
    .popup-detail { font-size:11px; color:#666; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
(function() {
  var map = L.map('map', { zoomControl: true, attributionControl: true })
              .setView([${lat}, ${lng}], 14);
  window.map = map;

  L.tileLayer('${tileUrl}', {
    attribution: '${tileAttrib}',
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);

  ${userLocation ? `
  // User location
  var userIcon = L.divIcon({ className:'', html:'<div class="user-dot"></div>', iconSize:[16,16], iconAnchor:[8,8] });
  L.marker([${lat}, ${lng}], { icon: userIcon }).addTo(map).bindPopup('<b>📍 Your Location</b>');
  ` : ''}

  // Bus markers
  var buses = ${JSON.stringify(busData)};
  buses.forEach(function(bus) {
    var pillClass = bus.isActive ? 'bus-pill' : 'bus-pill inactive';
    var icon = L.divIcon({
      className: '',
      html: '<div class="' + pillClass + '">🚌 ' + bus.eta + 'm</div>',
      iconAnchor: [25, 16],
    });
    var popup =
      '<div class="popup-title">' + bus.route + '</div>' +
      '<div class="popup-detail">' + bus.plateNumber + '</div>' +
      '<div class="popup-detail">→ ' + bus.destination + '</div>' +
      '<div class="popup-detail">ETA: <b>' + bus.eta + ' min</b></div>';
    L.marker([bus.lat, bus.lng], { icon: icon })
      .addTo(map)
      .bindPopup(popup)
      .on('click', function() {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type:'busPress', id: bus.id }));
      });
  });
})();
</script>
</body>
</html>`;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'busPress' && onBusPress) {
        const bus = buses.find(b => b.id === data.id);
        if (bus) onBusPress(bus);
      }
    } catch (_) {}
  };

  const activeBuses = buses.filter(b => b.isActive).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <WebView
        ref={webviewRef}
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.surface }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading map…</Text>
          </View>
        )}
        onMessage={handleMessage}
      />

      {/* Stats overlay */}
      <View style={[styles.statsBar, { backgroundColor: theme.surface + 'EE' }]}>
        <Text style={[styles.statsText, { color: theme.text }]}>
          📍 {activeBuses} active buses
        </Text>
        <Text style={[styles.statsText, { color: theme.textSecondary }]}>
          🗺️ OpenStreetMap
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statsBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
});