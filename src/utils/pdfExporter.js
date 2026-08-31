import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (
  mapElementId,
  validation,
  gpsPoints,
  startTime,
  endTime
) => {
  try {
    // Capturar elemento do mapa como imagem
    const mapElement = document.getElementById(mapElementId);
    if (!mapElement) {
      throw new Error('Elemento do mapa não encontrado');
    }

    const mapCanvas = await html2canvas(mapElement, {
      scale: 2,
      useCORS: true,
    });
    const mapImage = mapCanvas.toDataURL('image/png');

    // Criar documento PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Cores e estilos
    const primaryColor = [0, 123, 255]; // Azul
    const successColor = [40, 167, 69]; // Verde
    const warningColor = [255, 193, 7]; // Amarelo

    // ===== CABEÇALHO =====
    doc.setFontSize(20);
    doc.setTextColor(...primaryColor);
    doc.text('RELATÓRIO DE INSPEÇÃO 360°', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const reportDate = new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Relatório gerado em: ${reportDate}`, 105, 28, { align: 'center' });

    // ===== STATUS DE VALIDAÇÃO =====
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Status da Inspeção:', 15, 38);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    let statusY = 45;
    const statusItems = [
      {
        label: 'Cobertura GPS (Geométrica)',
        value: `${validation.gpsProgress}%`,
        valid: validation.gpsValid,
      },
      {
        label: 'Rotação Giroscópio',
        value: `${validation.orientationProgress}°`,
        valid: validation.orientationValid,
      },
      {
        label: 'Validação Geral',
        value: validation.overallValid ? 'APROVADA' : 'PENDENTE',
        valid: validation.overallValid,
      },
    ];

    statusItems.forEach((item) => {
      const color = item.valid ? successColor : warningColor;
      doc.setTextColor(...color);
      doc.text(`• ${item.label}: ${item.value}`, 15, statusY);
      statusY += 7;
    });

    // ===== MAPA =====
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.text('Mapa do Trajeto:', 15, statusY + 5);

    const mapWidth = 180;
    const mapHeight = 100;
    doc.addImage(mapImage, 'PNG', 15, statusY + 12, mapWidth, mapHeight);

    // ===== DADOS TÉCNICOS =====
    let dataY = statusY + 12 + mapHeight + 10;

    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.text('Dados Técnicos:', 15, dataY);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    dataY += 7;

    const duration = calculateDuration(startTime, endTime);
    const accuracy = gpsPoints.length > 0
      ? (gpsPoints.reduce((sum, p) => sum + (p.accuracy || 0), 0) / gpsPoints.length).toFixed(1)
      : 'N/A';

    const dataItems = [
      `• Total de pontos GPS coletados: ${gpsPoints.length}`,
      `• Duração da inspeção: ${duration}`,
      `• Acurácia média do GPS: ${accuracy}m`,
      `• Centro calculado: ${validation.centerPoint ? `${validation.centerPoint.lat.toFixed(5)}, ${validation.centerPoint.lng.toFixed(5)}` : 'N/A'}`,
      `• Distância final do ponto inicial: ${validation.distanceFromStart}m`,
    ];

    dataItems.forEach((item) => {
      if (dataY > doc.internal.pageSize.height - 20) {
        doc.addPage();
        dataY = 15;
      }
      doc.text(item, 15, dataY);
      dataY += 6;
    });

    // ===== RODAPÉ =====
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Este relatório foi gerado automaticamente pelo aplicativo de Inspeção 360° do Carro',
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );

    // Salvar
    const filename = `inspcao_360_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};

/**
 * Calcula duração entre dois timestamps
 */
function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return 'N/A';

  const diffMs = new Date(endTime) - new Date(startTime);
  const diffSecs = Math.floor(diffMs / 1000);
  const minutes = Math.floor(diffSecs / 60);
  const seconds = diffSecs % 60;

  return `${minutes}m ${seconds}s`;
}
