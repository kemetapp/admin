import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Icon } from './Icon';
import { colors, shadowStrong } from '../theme';

export type LatLng = { lat: number; lng: number };

export type MapMarker = LatLng & { label?: string; color?: string };

type Props = {
  center: LatLng;
  zoom?: number;
  satellite?: boolean;
  markers?: MapMarker[];
  /** خط مسار (GeoJSON LineString) اختياري. */
  route?: [number, number][];
  /** تفعيل سحب الدبوس واختيار نقطة. */
  pickable?: boolean;
  /** دبوس ثابت في منتصف الشاشة — الخريطة هي اللي بتتحرك تحته. */
  centerPin?: boolean;
  onPick?: (point: LatLng) => void;
  style?: object;
};

/**
 * خريطة MapLibre GL JS داخل WebView — بتشتغل على Expo Go بدون build مخصص.
 * المصادر: OpenStreetMap للشوارع، Sentinel-2 للأقمار — مجانية بالكامل.
 */
export function MapView({
  center,
  zoom = 13,
  satellite = false,
  markers = [],
  route,
  pickable = false,
  centerPin = false,
  onPick,
  style,
}: Props) {
  const html = useMemo(() => {
    const markersJson = JSON.stringify(markers);
    const routeJson = JSON.stringify(route ?? null);
    const styleJson = JSON.stringify(
      satellite
        ? {
            version: 8,
            sources: {
              sat: {
                type: 'raster',
                tiles: [
                  'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
                ],
                tileSize: 256,
                maxzoom: 15,
                attribution: 'Sentinel-2 cloudless © EOX',
              },
            },
            layers: [{ id: 'sat', type: 'raster', source: 'sat' }],
          }
        : {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                maxzoom: 19,
                attribution: '© OpenStreetMap',
              },
            },
            layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
          },
    );

    return `<!doctype html>
<html dir="rtl"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet"/>
<style>html,body,#m{margin:0;height:100%;background:#EFE1BE}
.maplibregl-ctrl-attrib{font-size:9px}</style>
</head><body><div id="m"></div>
<script>
  var map = new maplibregl.Map({
    container: 'm',
    style: ${styleJson},
    center: [${center.lng}, ${center.lat}],
    zoom: ${zoom}
  });
  map.addControl(new maplibregl.NavigationControl({showCompass:false}), 'top-left');

  var markers = ${markersJson};
  markers.forEach(function(m){
    new maplibregl.Marker({ color: m.color || '#4F5B2A' })
      .setLngLat([m.lng, m.lat])
      .setPopup(m.label ? new maplibregl.Popup().setText(m.label) : null)
      .addTo(map);
  });

  var routeCoords = ${routeJson};
  function drawRoute(){
    if (!routeCoords || routeCoords.length < 2) return;
    map.addSource('route', { type:'geojson', data:{ type:'Feature', properties:{},
      geometry:{ type:'LineString', coordinates: routeCoords } } });
    map.addLayer({ id:'route', type:'line', source:'route',
      paint:{ 'line-color':'#B4562F', 'line-width':5, 'line-opacity':0.9 } });
  }
  map.on('load', drawRoute);

  var pickable = ${pickable ? 'true' : 'false'};
  var pin = null;
  if (pickable) {
    map.on('click', function(e){
      var lat = Math.round(e.lngLat.lat * 1e6) / 1e6;
      var lng = Math.round(e.lngLat.lng * 1e6) / 1e6;
      if (!pin) {
        pin = new maplibregl.Marker({ color:'#B4562F', draggable:true })
          .setLngLat([lng, lat]).addTo(map);
        pin.on('dragend', function(){
          var p = pin.getLngLat();
          post({ lat: Math.round(p.lat*1e6)/1e6, lng: Math.round(p.lng*1e6)/1e6 });
        });
      } else {
        pin.setLngLat([lng, lat]);
      }
      post({ lat: lat, lng: lng });
    });
  }

  function post(payload){
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }

  // دبوس ثابت في المنتصف: الخريطة بتتحرك تحته وبنبعت المركز بعد كل حركة.
  var centerPin = ${centerPin ? 'true' : 'false'};
  if (centerPin) {
    var sendCenter = function(){
      var c = map.getCenter();
      post({ lat: Math.round(c.lat*1e6)/1e6, lng: Math.round(c.lng*1e6)/1e6 });
    };
    map.on('load', sendCenter);
    map.on('moveend', sendCenter);
  }
</script></body></html>`;
  }, [center.lat, center.lng, zoom, satellite, markers, route, pickable, centerPin]);

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        startInLoadingState
        onMessage={(event) => {
          if (!onPick) return;
          try {
            const data = JSON.parse(event.nativeEvent.data) as LatLng;
            if (typeof data.lat === 'number' && typeof data.lng === 'number') onPick(data);
          } catch {
            /* ignore */
          }
        }}
        style={styles.web}
      />
      {centerPin ? (
        <View pointerEvents="none" style={styles.pin}>
          <View style={styles.pinBubble}>
            <Icon name="pin" size={16} color={colors.white} />
          </View>
          <View style={styles.pinTip} />
          <View style={styles.pinShadow} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: 18, backgroundColor: '#EFE1BE' },
  web: { flex: 1, backgroundColor: 'transparent' },
  pin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    alignItems: 'center',
    marginLeft: -22,
    marginTop: -58,
  },
  pinBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.clay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    ...shadowStrong,
  },
  pinTip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.clay,
  },
  pinShadow: {
    width: 14,
    height: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.22)',
    marginTop: 2,
  },
});
