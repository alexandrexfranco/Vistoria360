import { useState, useEffect, useRef } from 'react';

export const useOrientation = () => {
  const [orientation, setOrientation] = useState({
    alpha: 0, // rotação ao redor do eixo Z (0-360°)
    beta: 0,  // rotação ao redor do eixo X (-180 a 180)
    gamma: 0, // rotação ao redor do eixo Y (-90 a 90)
  });
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const handlerRef = useRef(null);

  // Verificar suporte no início
  useEffect(() => {
    if ('DeviceOrientationEvent' in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      console.warn('DeviceOrientationEvent não suportado neste dispositivo');
    }
  }, []);

  // Handler para atualizar orientação
  const handleOrientation = (event) => {
    const { alpha, beta, gamma } = event;
    setOrientation({
      alpha: Math.round(alpha || 0),
      beta: Math.round(beta || 0),
      gamma: Math.round(gamma || 0),
    });
  };

  // Função para solicitar permissão e ativar listener
  const requestPermission = async () => {
    try {
      // iOS 13+ requer permissão explícita
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          // Remover listener anterior se existir
          if (handlerRef.current) {
            window.removeEventListener('deviceorientation', handlerRef.current);
          }
          // Adicionar novo listener
          handlerRef.current = handleOrientation;
          window.addEventListener('deviceorientation', handlerRef.current);
          setPermissionGranted(true);
          console.log('✓ Permissão de orientação concedida');
          return true;
        } else {
          console.warn('Permissão de orientação negada');
          return false;
        }
      } else {
        // Android ou navegadores sem requestPermission - tentar adicionar listener direto
        if (handlerRef.current) {
          window.removeEventListener('deviceorientation', handlerRef.current);
        }
        handlerRef.current = handleOrientation;
        window.addEventListener('deviceorientation', handlerRef.current);
        setPermissionGranted(true);
        console.log('✓ Listener de orientação ativado');
        return true;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão de orientação:', error);
      return false;
    }
  };

  // Limpar listener ao desmontar
  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        window.removeEventListener('deviceorientation', handlerRef.current);
      }
    };
  }, []);

  return {
    orientation,
    isSupported,
    permissionGranted,
    requestPermission,
  };
};
