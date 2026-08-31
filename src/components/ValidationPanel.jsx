import React from 'react';

export const ValidationPanel = ({ validation, isTracking }) => {
  const {
    gpsValid,
    orientationValid,
    overallValid,
    gpsProgress,
    orientationProgress,
    distanceFromStart,
  } = validation;

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ marginTop: 0 }}>📊 Status da Inspeção</h3>

      {/* Progresso GPS */}
      <div style={{ marginBottom: '15px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
          }}
        >
          <span>
            🗺️ Cobertura GPS (Geométrica): <strong>{gpsProgress}%</strong>
          </span>
          <span style={{ color: gpsValid ? '#28a745' : '#ffc107' }}>
            {gpsValid ? '✓ Válido' : '⏳ Progredindo'}
          </span>
        </div>
        <ProgressBar value={gpsProgress} max={100} color="#007bff" />
      </div>

      {/* Progresso Orientação */}
      <div style={{ marginBottom: '15px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
          }}
        >
          <span>
            🧭 Rotação do Celular: <strong>{orientationProgress}°</strong>
          </span>
          <span style={{ color: orientationValid ? '#28a745' : '#ffc107' }}>
            {orientationValid ? '✓ Válido' : '⏳ Progredindo'}
          </span>
        </div>
        <ProgressBar value={orientationProgress} max={360} color="#6f42c1" />
      </div>

      {/* Status Geral */}
      <div
        style={{
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: overallValid ? '#d4edda' : '#fff3cd',
          border: `2px solid ${overallValid ? '#28a745' : '#ffc107'}`,
          textAlign: 'center',
          fontWeight: 'bold',
          color: overallValid ? '#155724' : '#856404',
        }}
      >
        {overallValid ? (
          <>
            🎉 Volta de 360° Confirmada!
            <br />
            <small style={{ display: 'block', marginTop: '5px', fontWeight: 'normal' }}>
              Inspeção válida - Pronto para gerar relatório
            </small>
          </>
        ) : (
          <>
            {isTracking ? '⏳ Rastreando...' : '⏸️ Pronto para começar'}
            <br />
            <small style={{ display: 'block', marginTop: '5px', fontWeight: 'normal' }}>
              Ambas as validações devem passar
            </small>
          </>
        )}
      </div>

      {/* Informações Auxiliares */}
      {distanceFromStart && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #dee2e6',
            fontSize: '14px',
            color: '#666',
          }}
        >
          📍 Distância do ponto inicial: <strong>{distanceFromStart}m</strong>
          <br />
          <small>
            (Esperado: 8-12m para um carro. Se &gt; 15m, pode ser ruído de GPS)
          </small>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para barra de progresso
function ProgressBar({ value, max, color }) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div
      style={{
        width: '100%',
        height: '24px',
        backgroundColor: '#e9ecef',
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${color}`,
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          transition: 'width 0.3s ease',
        }}
      >
        {percentage > 10 && `${Math.round(percentage)}%`}
      </div>
    </div>
  );
}
