import React, { useState, useEffect } from 'react';
import { useGPS } from './hooks/useGPS';
import { useOrientation } from './hooks/useOrientation';
import { useValidation } from './hooks/useValidation';
import { MapComponent } from './components/MapComponent';
import { ValidationPanel } from './components/ValidationPanel';
import { exportToPDF } from './utils/pdfExporter';
import { storageManager } from './utils/storage';
import './App.css';

function App() {
  const gps = useGPS();
  const orientation = useOrientation();
  const validation = useValidation(gps.gpsPoints, orientation.orientation);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Carregar histórico ao montar componente
  useEffect(() => {
    loadHistory();
  }, []);

  const handleStartTracking = async () => {
    // Solicitar permissão de GPS
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada neste navegador');
      return;
    }

    setStartTime(new Date());
    setEndTime(null);
    gps.resetTracking();
    gps.startTracking();

    // Solicitar permissão de orientação (iOS 13+ e Android)
    if (orientation.isSupported) {
      const success = await orientation.requestPermission();
      if (!success) {
        console.warn('Aviso: Não foi possível ativar o sensor de orientação');
      }
    }
  };

  const handleStopTracking = () => {
    gps.stopTracking();
    setEndTime(new Date());
  };

  const handleResetTracking = () => {
    gps.resetTracking();
    setStartTime(null);
    setEndTime(null);
  };

  const handleExportPDF = async () => {
    if (gps.gpsPoints.length === 0) {
      alert('Nenhum dado de trajeto para exportar');
      return;
    }

    setExporting(true);
    try {
      await exportToPDF(
        'map-container',
        validation,
        gps.gpsPoints,
        startTime,
        endTime
      );

      // Salvar inspeção no histórico
      const inspection = storageManager.saveInspection({
        gpsPoints: gps.gpsPoints,
        validation,
        duration: endTime ? endTime - startTime : null,
        pointsCount: gps.gpsPoints.length,
      });

      alert('PDF exportado com sucesso! ✓');
      loadHistory();
    } catch (error) {
      alert(`Erro ao exportar PDF: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const loadHistory = () => {
    const allInspections = storageManager.getAllInspections();
    setHistory(allInspections);
    setStats(storageManager.getStats());
  };

  const handleDeleteInspection = (id) => {
    if (window.confirm('Deseja deletar esta inspeção?')) {
      storageManager.deleteInspection(id);
      loadHistory();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Deseja limpar TODO o histórico? Esta ação não pode ser desfeita.')) {
      storageManager.clearAll();
      loadHistory();
    }
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <h1>🚗 Inspeção 360° do Carro</h1>
        <p className="subtitle">Rastreie uma volta completa ao redor do seu veículo</p>
      </header>

      <main className="app-main">
        {/* SEÇÃO 1: CONTROLES */}
        <section className="section">
          <h2>🎮 Controles</h2>

          <div className="info-box">
            <p>
              <strong>Como usar:</strong>
            </p>
            <ol>
              <li>Clique em "Iniciar Rastreamento"</li>
              <li>Caminhe ao redor do carro enquanto segura o celular</li>
              <li>Complete uma volta de 360°</li>
              <li>Clique em "Parar" quando terminar</li>
              <li>Exporte o relatório em PDF</li>
            </ol>
          </div>

          <div className="button-group">
            <button
              onClick={handleStartTracking}
              disabled={gps.isTracking}
              className="btn btn-primary"
            >
              🟢 Iniciar Rastreamento
            </button>
            <button
              onClick={handleStopTracking}
              disabled={!gps.isTracking}
              className="btn btn-warning"
            >
              ⏹️ Parar
            </button>
            <button
              onClick={handleResetTracking}
              className="btn btn-secondary"
            >
              🔄 Resetar
            </button>
          </div>

          {/* Mostrar erros */}
          {gps.error && (
            <div className="error-message">
              ⚠️ {gps.error}
            </div>
          )}

          {/* Informações em tempo real */}
          {gps.isTracking && (
            <div className="live-info">
              <div className="info-item">
                <span>📍 Pontos coletados:</span>
                <strong>{gps.gpsPoints.length}</strong>
              </div>
              <div className="info-item">
                <span>📊 Acurácia GPS:</span>
                <strong>{gps.accuracy ? `±${gps.accuracy.toFixed(1)}m` : 'Calculando...'}</strong>
              </div>
              <div className="info-item">
                <span>🧭 Orientação celular:</span>
                <strong>{orientation.orientation.alpha}°</strong>
              </div>
            </div>
          )}
        </section>

        {/* SEÇÃO 2: MAPA */}
        <section className="section">
          <h2>🗺️ Mapa do Trajeto</h2>
          <div id="map-container">
            <MapComponent
              gpsPoints={gps.gpsPoints}
              currentPosition={gps.currentPosition}
              centerPoint={validation.centerPoint}
              isTracking={gps.isTracking}
            />
          </div>
        </section>

        {/* SEÇÃO 3: VALIDAÇÃO */}
        <section className="section">
          <ValidationPanel validation={validation} isTracking={gps.isTracking} />
        </section>

        {/* SEÇÃO 4: EXPORTAR */}
        <section className="section">
          <h2>💾 Exportar Relatório</h2>

          <button
            onClick={handleExportPDF}
            disabled={gps.gpsPoints.length === 0 || exporting}
            className="btn btn-success btn-large"
          >
            {exporting ? '⏳ Gerando PDF...' : '📄 Exportar como PDF'}
          </button>

          {gps.gpsPoints.length > 0 && (
            <p style={{ color: '#666', marginTop: '10px', fontSize: '14px' }}>
              ✓ {gps.gpsPoints.length} pontos GPS prontos para exportar
            </p>
          )}
        </section>

        {/* SEÇÃO 5: HISTÓRICO */}
        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>📚 Histórico de Inspeções</h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-small"
            >
              {showHistory ? '▼ Ocultar' : '▶ Mostrar'}
            </button>
          </div>

          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.totalInspections}</div>
                <div className="stat-label">Total de Inspeções</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.successfulInspections}</div>
                <div className="stat-label">Bem-sucedidas</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.successRate}%</div>
                <div className="stat-label">Taxa de Sucesso</div>
              </div>
            </div>
          )}

          {showHistory && history.length > 0 && (
            <div className="history-list">
              {history.map((inspection) => (
                <div key={inspection.id} className="history-item">
                  <div className="history-header">
                    <span className="history-date">
                      📅 {new Date(inspection.timestamp).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span
                      className={`history-status ${
                        inspection.validation?.overallValid ? 'valid' : 'invalid'
                      }`}
                    >
                      {inspection.validation?.overallValid ? '✓ Válida' : '✗ Inválida'}
                    </span>
                  </div>
                  <div className="history-details">
                    <small>
                      📍 {inspection.pointsCount} pontos • ⏱️{' '}
                      {inspection.duration ? `${Math.round(inspection.duration / 1000)}s` : 'N/A'}
                    </small>
                  </div>
                  <button
                    onClick={() => handleDeleteInspection(inspection.id)}
                    className="btn btn-small btn-danger"
                  >
                    🗑️ Deletar
                  </button>
                </div>
              ))}

              <button
                onClick={handleClearAll}
                className="btn btn-danger btn-small"
                style={{ marginTop: '15px', width: '100%' }}
              >
                🗑️ Limpar Todo Histórico
              </button>
            </div>
          )}

          {showHistory && history.length === 0 && (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              Nenhuma inspeção registrada ainda
            </p>
          )}
        </section>

        {/* SEÇÃO 6: INFORMAÇÕES */}
        <section className="section">
          <h2>ℹ️ Informações Técnicas</h2>
          <div className="info-box">
            <h4>Permissões Necessárias:</h4>
            <ul>
              <li>✓ Geolocalização (GPS)</li>
              <li>
                {orientation.isSupported && orientation.permissionGranted
                  ? '✓ Orientação do Dispositivo'
                  : '✗ Orientação do Dispositivo'}
              </li>
            </ul>

            {orientation.debugInfo && (
              <div
                style={{
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '5px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  border: '1px solid #ddd',
                }}
              >
                <strong>📊 Status dos Sensores:</strong>
                <div style={{ marginTop: '5px' }}>{orientation.debugInfo}</div>
              </div>
            )}

            <h4 style={{ marginTop: '15px' }}>Ambiente:</h4>
            <ul>
              <li>
                {window.location.protocol === 'https:' || window.location.hostname === 'localhost'
                  ? '✓ HTTPS/Localhost (Necessário para sensores)'
                  : '✗ HTTP (Sensores bloqueados - Use HTTPS)'}
              </li>
            </ul>

            <h4 style={{ marginTop: '15px' }}>Dicas para Melhor Acurácia:</h4>
            <ul>
              <li>🏞️ Caminhe em locais abertos (menos interferência de GPS)</li>
              <li>📱 Segure o celular apontando para cima</li>
              <li>⏱️ Caminhe devagar e completar volta em ~2 minutos</li>
              <li>🚗 Mantenha distância de ~8-12m do carro</li>
              <li>🌤️ Evite ambientes cobertos (garagens, sob árvores)</li>
            </ul>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <p>© 2024 Inspeção 360° do Carro | Desenvolvido com React + Leaflet</p>
      </footer>
    </div>
  );
}

export default App;
