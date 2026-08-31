import { useState, useEffect, useRef } from 'react';

export const useOrientation = () => {
  const [orientation, setOrientation] = useState({
    alpha: 0, // rotação ao redor do eixo Z (0-360°)
    beta: 0,  // rotação ao redor do eixo X (-180 a 180)
    gamma: 0, // rotação ao redor do eixo Y (-90 a 90)
  });
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const handlerRef = useRef(null);
  const motionHandlerRef = useRef(null);
  const eventCountRef = useRef(0);

  // Verificar suporte no início
  useEffect(() => {
    const isOrientationSupported = 'DeviceOrientationEvent' in window;
    const isMotionSupported = 'DeviceMotionEvent' in window;
    
    setIsSupported(isOrientationSupported || isMotionSupported);
    
    console.log('🔍 DEBUG - Suporte de sensores:');
    console.log('  DeviceOrientationEvent:', isOrientationSupported);
    console.log('  DeviceMotionEvent:', isMotionSupported);
    console.log('  Protocolo:', window.location.protocol);
    console.log('  Host:', window.location.hostname);
  }, []);

  // Handler para DeviceOrientationEvent
  const handleOrientation = (event) => {
    const { alpha, beta, gamma, absolute } = event;
    eventCountRef.current++;
    
    setOrientation({
      alpha: Math.round(alpha || 0),
      beta: Math.round(beta || 0),
      gamma: Math.round(gamma || 0),
    });

    if (eventCountRef.current === 1) {
      console.log('✓ DeviceOrientationEvent disparado! Alpha:', Math.round(alpha));
    }
  };

  // Handler para DeviceMotionEvent (fallback)
  const handleMotion = (event) => {
    const { rotationRate, acceleration } = event;
    
    if (rotationRate && (rotationRate.alpha || rotationRate.beta || rotationRate.gamma)) {
      eventCountRef.current++;
      
      if (eventCountRef.current === 1) {
        console.log('✓ DeviceMotionEvent disparado!', rotationRate);
      }
    }
  };

  // Função para solicitar permissão e ativar listeners
  const requestPermission = async () => {
    try {
      console.log('🔔 Solicitando permissão de sensores...');

      // iOS 13+ requer permissão explícita para DeviceOrientationEvent
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        console.log('📱 iOS detectado - solicitando requestPermission');
        
        const permission = await DeviceOrientationEvent.requestPermission();
        
        console.log('📋 Resposta:', permission);
        
        if (permission === 'granted') {
          // Remover listeners anteriores
          if (handlerRef.current) {
            window.removeEventListener('deviceorientation', handlerRef.current);
          }
          if (motionHandlerRef.current) {
            window.removeEventListener('devicemotion', motionHandlerRef.current);
          }
          
          // Adicionar listeners
          handlerRef.current = handleOrientation;
          window.addEventListener('deviceorientation', handlerRef.current);
          
          motionHandlerRef.current = handleMotion;
          window.addEventListener('devicemotion', motionHandlerRef.current);
          
          setPermissionGranted(true);
          setDebugInfo('✅ Permissão concedida! Girando o celular...');
          console.log('✅ Listeners ativados para iOS');
          return true;
        } else {
          setDebugInfo('❌ Permissão negada pelo usuário');
          console.warn('❌ Permissão negada:', permission);
          return false;
        }
      } else {
        // Android - não requer requestPermission, ativa direto
        console.log('🤖 Android detectado - ativando listeners direto');
        
        // Remover listeners anteriores
        if (handlerRef.current) {
          window.removeEventListener('deviceorientation', handlerRef.current);
        }
        if (motionHandlerRef.current) {
          window.removeEventListener('devicemotion', motionHandlerRef.current);
        }
        
        // Adicionar listeners
        handlerRef.current = handleOrientation;
        window.addEventListener('deviceorientation', handlerRef.current);
        
        motionHandlerRef.current = handleMotion;
        window.addEventListener('devicemotion', motionHandlerRef.current);
        
        setPermissionGranted(true);
        setDebugInfo('✅ Listeners ativados! Girando o celular...');
        console.log('✅ Listeners ativados para Android');
        return true;
      }
    } catch (error) {
      setDebugInfo(`❌ Erro: ${error.message}`);
      console.error('❌ Erro ao solicitar permissão:', error);
      return false;
    }
  };

  // Limpar listeners ao desmontar
  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        window.removeEventListener('deviceorientation', handlerRef.current);
      }
      if (motionHandlerRef.current) {
        window.removeEventListener('devicemotion', motionHandlerRef.current);
      }
    };
  }, []);

  return {
    orientation,
    isSupported,
    permissionGranted,
    debugInfo,
    requestPermission,
  };
};
