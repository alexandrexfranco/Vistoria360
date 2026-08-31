const STORAGE_KEY = 'inspeccao_360_historico';
const MAX_RECORDS = 50; // Manter apenas os últimos 50

export const storageManager = {
  /**
   * Salvar uma inspeção completada
   */
  saveInspection: (data) => {
    try {
      const inspections = storageManager.getAllInspections();

      const newInspection = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...data,
      };

      inspections.unshift(newInspection); // Adicionar no início
      inspections.splice(MAX_RECORDS); // Manter apenas os últimos 50

      localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections));
      return newInspection;
    } catch (error) {
      console.error('Erro ao salvar inspeção:', error);
      throw error;
    }
  },

  /**
   * Recuperar todas as inspeções
   */
  getAllInspections: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao recuperar inspeções:', error);
      return [];
    }
  },

  /**
   * Recuperar uma inspeção específica por ID
   */
  getInspectionById: (id) => {
    try {
      const inspections = storageManager.getAllInspections();
      return inspections.find((i) => i.id === id);
    } catch (error) {
      console.error('Erro ao recuperar inspeção:', error);
      return null;
    }
  },

  /**
   * Deletar uma inspeção
   */
  deleteInspection: (id) => {
    try {
      const inspections = storageManager.getAllInspections();
      const filtered = inspections.filter((i) => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Erro ao deletar inspeção:', error);
      return false;
    }
  },

  /**
   * Limpar todo o histórico
   */
  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      return false;
    }
  },

  /**
   * Exportar inspeções como JSON
   */
  exportAsJSON: () => {
    try {
      const inspections = storageManager.getAllInspections();
      const dataStr = JSON.stringify(inspections, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inspeccoes_360_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar JSON:', error);
    }
  },

  /**
   * Obter estatísticas do histórico
   */
  getStats: () => {
    try {
      const inspections = storageManager.getAllInspections();
      const validInspections = inspections.filter((i) => i.validation?.overallValid);

      return {
        totalInspections: inspections.length,
        successfulInspections: validInspections.length,
        successRate: inspections.length > 0
          ? ((validInspections.length / inspections.length) * 100).toFixed(1)
          : 0,
        firstInspection: inspections[inspections.length - 1]?.timestamp || null,
        lastInspection: inspections[0]?.timestamp || null,
      };
    } catch (error) {
      console.error('Erro ao calcular stats:', error);
      return null;
    }
  },
};
