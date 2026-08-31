import { useState, useEffect, useRef } from 'react';

export const useGPS = () => {
  const [gpsPoints, setGpsPoints] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const watchIdRef = useRef(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste navegador');
      return;
    }

    setIsTracking(true);
    setGpsPoints([]);
    setError(null);

    // Coleta de ponto a cada 1 segundo (bom para 2 minutos)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc } = position.coords;
        const timestamp = new Date();

        setCurrentPosition({ latitude, longitude, timestamp });
        setAccuracy(acc);

        setGpsPoints((prev) => [
          ...prev,
          {
            id: prev.length,
            latitude,
            longitude,
            timestamp,
            accuracy: acc,
          },
        ]);

        setError(null);
      },
      (err) => {
        setError(`Erro GPS: ${err.message}`);
      },
      {
        enableHighAccuracy: true, // Mais preciso, gasta mais bateria
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    setIsTracking(false);
  };

  const resetTracking = () => {
    stopTracking();
    setGpsPoints([]);
    setCurrentPosition(null);
    setError(null);
    setAccuracy(null);
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    gpsPoints,
    currentPosition,
    isTracking,
    error,
    accuracy,
    startTracking,
    stopTracking,
    resetTracking,
  };
};
