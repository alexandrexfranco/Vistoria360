import { useState, useEffect, useRef } from 'react';

export const useValidation = (gpsPoints, orientation) => {
  const [validation, setValidation] = useState({
    gpsValid: false,
    orientationValid: false,
    overallValid: false,
    gpsProgress: 0,
    orientationProgress: 0,
    distanceFromStart: null,
    angleCompleted: 0,
    centerPoint: null,
  });

  const initialAlphaRef = useRef(null);
  const accumulatedRotationRef = useRef(0);
  const lastAlphaRef = useRef(null);

  // Rastrear mudança cumulativa de rotação
  useEffect(() => {
    const currentAlpha = orientation.alpha || 0;

    // Primeira leitura - definir ângulo inicial
    if (initialAlphaRef.current === null) {
      initialAlphaRef.current = currentAlpha;
      lastAlphaRef.current = currentAlpha;
      return;
    }

    // Calcular mudança desde a última leitura
    let delta = currentAlpha - (lastAlphaRef.current || currentAlpha);

    // Tratar descontinuidade quando cruza 0°/360°
    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }

    accumulatedRotationRef.current += Math.abs(delta);
    lastAlphaRef.current = currentAlpha;
  }, [orientation.alpha]);

  useEffect(() => {
    if (gpsPoints.length < 5) {
      return; // Precisa de pelo menos 5 pontos para começar a validar
    }

    // ========== VALIDAÇÃO GPS (Geometria) ==========
    // 1. Encontrar o centro (aproximadamente no meio do trajeto)
    const centerPoint = calculateCenter(gpsPoints);

    // 2. Calcular se cada ponto está a uma distância similar do centro
    const distances = gpsPoints.map((point) =>
      calculateDistance(point.latitude, point.longitude, centerPoint.lat, centerPoint.lng)
    );

    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const lastDistance = distances[distances.length - 1];

    // Validar GPS: se voltou próximo do ponto inicial (circulo fechado)
    // Consideramos válido se o último ponto está entre 80-120% da distância média
    const gpsValid =
      lastDistance >= avgDistance * 0.8 && lastDistance <= avgDistance * 1.2;

    // Progresso GPS: medir cobertura angular
    const gpsProgress = calculateAngularCoverage(gpsPoints, centerPoint);

    // ========== VALIDAÇÃO ORIENTAÇÃO (Giroscópio) ==========
    // Usar rotação acumulada calculada
    const orientationProgress = accumulatedRotationRef.current;
    const orientationValid = orientationProgress > 270; // Pelo menos 270° de rotação

    // ========== VALIDAÇÃO GERAL ==========
    const overallValid = gpsValid && orientationValid;

    setValidation({
      gpsValid,
      orientationValid,
      overallValid,
      gpsProgress: Math.round(gpsProgress),
      orientationProgress: Math.round(orientationProgress),
      angleCompleted: Math.round(gpsProgress),
      centerPoint,
      distanceFromStart: lastDistance ? Math.round(lastDistance) : 0,
    });
  }, [gpsPoints, orientation]);

  // Função para resetar rastreamento de rotação
  useEffect(() => {
    // Detectar quando o rastreamento é resetado (gpsPoints vazio)
    if (gpsPoints.length === 0) {
      initialAlphaRef.current = null;
      accumulatedRotationRef.current = 0;
      lastAlphaRef.current = null;
    }
  }, [gpsPoints.length]);

  return validation;
};

/**
 * Calcula o centro (média) de todos os pontos GPS
 */
function calculateCenter(points) {
  const sumLat = points.reduce((sum, p) => sum + p.latitude, 0);
  const sumLng = points.reduce((sum, p) => sum + p.longitude, 0);

  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length,
  };
}

/**
 * Calcula distância entre dois pontos em metros (Haversine)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Calcula cobertura angular ao redor do centro
 * Retorna a porcentagem de 360° que foi coberta
 */
function calculateAngularCoverage(points, center) {
  if (points.length < 2) return 0;

  const angles = points.map((point) => {
    const bearing = calculateBearing(center.lat, center.lng, point.latitude, point.longitude);
    return bearing;
  });

  // Calcular a "varredura" angular (diferença entre ângulo máximo e mínimo)
  let minAngle = Math.min(...angles);
  let maxAngle = Math.max(...angles);

  // Se a varredura cruzar de 359° para 1°, ajustar
  let coverage = maxAngle - minAngle;

  if (coverage > 180) {
    coverage = 360 - coverage;
  }

  // Retornar como porcentagem de 360°
  return (coverage / 360) * 100;
}

/**
 * Calcula o azimute (bearing) entre dois pontos
 * Retorna ângulo em graus (0-360)
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360; // Converter para 0-360
}
