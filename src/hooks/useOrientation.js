import { useState, useEffect } from 'react';

export const useOrientation = () => {
  const [orientation, setOrientation] = useState({
    alpha: 0, // rotação ao redor do eixo Z (0-360°)
    beta: 0,  // rotação ao redor do eixo X (-180 a 180)
    gamma: 0, // rotação ao redor do eixo Y (-90 a 90)
  });
  const [isSupported, setIsSupported] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      const { alpha, beta, gamma } = event;
      setOrientation({
        alpha: Math.round(alpha || 0),
        beta: Math.round(beta || 0),
        gamma: Math.round(gamma || 0),
      });
    };

    if ('DeviceOrientationEvent' in window) {
      // Verificar se é HTTPS ou localhost
      if (
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost'
      ) {
        window.addEventListener('deviceorientation', handler);
        setPermissionGranted(true);
        return () => {
          window.removeEventListener('deviceorientation', handler);
        };
      } else {
        setIsSupported(false);
      }
    } else {
      setIsSupported(false);
    }
  }, []);

  // Função para solicitar permissão no iOS 13+
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', (event) => {
            setOrientation({
              alpha: Math.round(event.alpha || 0),
              beta: Math.round(event.beta || 0),
              gamma: Math.round(event.gamma || 0),
            });
          });
          setPermissionGranted(true);
        }
      } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
      }
    }
  };

  return {
    orientation,
    isSupported,
    permissionGranted,
    requestPermission,
  };
};
