import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Corrigir ícones padrão do Leaflet no React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export const MapComponent = ({ gpsPoints, currentPosition, centerPoint, isTracking }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const centerMarkerRef = useRef(null);

  // Inicializar mapa na primeira renderização
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const map = L.map(mapRef.current).setView([-20.3, -40.3], 19); // Zoom alto para carro

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 22,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Não destruir mapa ao desmontar (causa problemas com Leaflet)
    };
  }, []);

  // Atualizar trajeto quando novos pontos chegam
  useEffect(() => {
    if (!mapInstanceRef.current || gpsPoints.length === 0) return;

    const map = mapInstanceRef.current;

    // Remover polyline anterior
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
    }

    // Criar nova polyline
    const latlngs = gpsPoints.map((p) => [p.latitude, p.longitude]);
    const polyline = L.polyline(latlngs, {
      color: '#007bff',
      weight: 3,
      opacity: 0.8,
      dashArray: '5, 5', // Linha tracejada
    }).addTo(map);

    polylineRef.current = polyline;

    // Atualizar marcador de início
    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
    }
    const startMarker = L.marker([gpsPoints[0].latitude, gpsPoints[0].longitude], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
      title: 'Ponto de Início',
    })
      .bindPopup('🟢 Início da Inspeção')
      .addTo(map);
    startMarkerRef.current = startMarker;

    // Atualizar marcador de fim
    if (endMarkerRef.current) {
      map.removeLayer(endMarkerRef.current);
    }
    const lastPoint = gpsPoints[gpsPoints.length - 1];
    const endMarker = L.marker([lastPoint.latitude, lastPoint.longitude], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
      title: 'Posição Atual',
    })
      .bindPopup('🔴 Posição Atual')
      .addTo(map);
    endMarkerRef.current = endMarker;

    // Centralizar mapa no trajeto
    if (latlngs.length > 0) {
      map.fitBounds(L.latLngBounds(latlngs).pad(0.1));
    }
  }, [gpsPoints]);

  // Adicionar marcador do centro (carro)
  useEffect(() => {
    if (!mapInstanceRef.current || !centerPoint) return;

    const map = mapInstanceRef.current;

    if (centerMarkerRef.current) {
      map.removeLayer(centerMarkerRef.current);
    }

    const centerMarker = L.marker([centerPoint.lat, centerPoint.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
      title: 'Centro (Carro)',
    })
      .bindPopup('🟡 Centro Calculado')
      .addTo(map);

    centerMarkerRef.current = centerMarker;
  }, [centerPoint]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    />
  );
};
