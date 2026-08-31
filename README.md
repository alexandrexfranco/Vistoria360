# 🚗 Inspeção 360° do Carro

Aplicação PWA (Progressive Web App) para rastrear uma volta completa de 360° ao redor de um carro usando GPS e giroscópio do celular.

## 📋 Requisitos

- **Node.js**: 14+ (para desenvolvimento)
- **Android**: 6.0+ (para melhor suporte a sensores)
- **Navegador**: Chrome, Firefox, Edge (suporte a Geolocation e DeviceOrientation)
- **Conexão**: HTTPS (ou localhost para desenvolvimento)

## 🚀 Setup do Projeto

### 1. Clonar/Criar Projeto

```bash
npx create-react-app inspeccao-360-carro
cd inspeccao-360-carro
```

### 2. Instalar Dependências

```bash
npm install leaflet react-leaflet dexie jspdf html2canvas
```

### 3. Substituir Arquivos

Copie os arquivos criados para suas respectivas localizações:

```
src/
├── hooks/
│   ├── useGPS.js          (novo)
│   ├── useOrientation.js  (novo)
│   └── useValidation.js   (novo)
├── components/
│   ├── MapComponent.jsx   (novo)
│   └── ValidationPanel.jsx (novo)
├── utils/
│   ├── pdfExporter.js     (novo)
│   └── storage.js         (novo)
├── App.jsx                (substituir)
├── App.css                (substituir)
└── index.js               (manter)
```

### 4. Executar Localmente

```bash
npm start
```

Acesse: `http://localhost:3000`

## 📱 Como Usar

### Passo a Passo

1. **Iniciar Rastreamento**
   - Clique no botão "🟢 Iniciar Rastreamento"
   - Aceite as permissões de GPS e Orientação
   - Aguarde 2-3 segundos para adquirir sinal de satélites

2. **Fazer a Volta**
   - Caminhe ao redor do carro devagar
   - Mantenha o celular apontado para cima
   - Complete uma volta circular de 360°
   - A inspeção leva aproximadamente 2 minutos

3. **Parar e Validar**
   - Clique em "⏹️ Parar"
   - Verifique as barras de progresso:
     - 🗺️ GPS (Geométrica): deve chegar a 100%
     - 🧭 Giroscópio: deve passar de 270°
   - Se ambas forem válidas, você verá: "🎉 Volta de 360° Confirmada!"

4. **Exportar Relatório**
   - Clique em "📄 Exportar como PDF"
   - Um PDF com mapa e dados será gerado
   - A inspeção é automaticamente salva no histórico

### Interface Principal

```
┌─────────────────────────────────────┐
│    🚗 Inspeção 360° do Carro       │
├─────────────────────────────────────┤
│                                      │
│  [Iniciar] [Parar] [Resetar]        │
│  📍 Pontos: 120 | 📊 GPS: ±5m       │
│                                      │
│  ┌─────────────────────────────────┐│
│  │                                  ││
│  │      Mapa (Leaflet)             ││
│  │   [Trajeto em Azul]             ││
│  │                                  ││
│  └─────────────────────────────────┘│
│                                      │
│  🗺️ GPS: ████░░░░░░ 50%            │
│  🧭 Giroscópio: ██████░░░░ 65%      │
│                                      │
│  [📄 Exportar como PDF]             │
│                                      │
│  📚 Histórico (5 inspeções)         │
│  ✓ 2024-08-30 | 150 pontos         │
│  ✓ 2024-08-29 | 142 pontos         │
│                                      │
└─────────────────────────────────────┘
```

## 🔧 Troubleshooting

### ❌ "Geolocalização não suportada"

**Causa**: Navegador não tem suporte ou está bloqueado.

**Solução**:
- Use Chrome, Firefox, Edge no Android
- Verifique se o GPS do telefone está ativado
- Verifique permissões do app em Configurações → Apps

### ❌ "GPS com muita imprecisão" (±20m+)

**Causa**: Ambiente coberto, prédios altos, interferência.

**Solução**:
- Teste em local aberto (estacionamento, rua)
- Evite garagens, sob árvores, entre prédios
- Aguarde 1-2 minutos para adquirir satélites
- Use enableHighAccuracy (já ativado no código)

### ❌ "Giroscópio não funciona"

**Causa**: Dispositivo antigo, permissão bloqueada, ou HTTPS não configurado.

**Solução**:
- No iOS: Configurações → Safari → Privacidade → Permita Orientação
- No Android: Configurações → Apps → Permissões → Sensores
- Use HTTPS em produção (localhost funciona)

### ❌ "PDF vazio ou sem mapa"

**Causa**: Captura do mapa falhou.

**Solução**:
- Aguarde o mapa carregar completamente
- Tente novamente
- Verifique console (F12) para erros

### ❌ "Dados não salvam no histórico"

**Causa**: LocalStorage desativado ou app em modo privado.

**Solução**:
- Desative modo privado/anônimo
- Limpe cache do navegador
- Verifique espaço disponível no celular

## 📊 Estrutura de Dados

### GPS Point

```javascript
{
  id: 0,
  latitude: -20.3145,
  longitude: -40.2891,
  timestamp: Date,
  accuracy: 5.2  // em metros
}
```

### Validation Object

```javascript
{
  gpsValid: true,           // Circulo fechado?
  orientationValid: true,   // 360° de rotação?
  overallValid: true,       // Ambas válidas?
  gpsProgress: 95,          // % de cobertura
  orientationProgress: 358, // graus completados
  angleCompleted: 95,       // % angular
  centerPoint: {
    lat: -20.3145,
    lng: -40.2891
  },
  distanceFromStart: 11     // em metros
}
```

### Inspection (LocalStorage)

```javascript
{
  id: 1693392000000,
  timestamp: "2024-08-30T15:20:00.000Z",
  gpsPoints: [...],
  validation: {...},
  duration: 125000,    // em ms
  pointsCount: 120
}
```

## 📐 Algoritmo de Validação

### Validação GPS (Geométrica)

1. Calcular centro (média de todos os pontos)
2. Calcular distância de cada ponto ao centro
3. Verificar se último ponto está a 80-120% da distância média
4. Calcular cobertura angular (360° em volta do centro)
5. ✓ Válido se: círculo fechado + cobertura > 80%

### Validação Giroscópio (Orientação)

1. Rastrear `DeviceOrientationEvent.alpha` (0-360°)
2. Medir mudanças cumulativas de ângulo
3. ✓ Válido se: ≥ 270° de rotação completada

### Resultado Final

**Ambas devem passar** para confirmar 360° válido.

## 🛠️ Desenvolvimento

### Estrutura de Pasta Recomendada

```
inspeccao-360-carro/
├── public/
│   ├── index.html
│   └── manifest.json (PWA)
├── src/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── App.jsx
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── README.md
└── .env (opcional)
```

### Adicionar Funcionalidades

#### 1. Sincronizar com Backend

No `pdfExporter.js`, após gerar PDF:

```javascript
// Enviar para servidor
const formData = new FormData();
formData.append('pdf', pdfBlob);
formData.append('data', JSON.stringify(validation));

await fetch('/api/inspections', {
  method: 'POST',
  body: formData
});
```

#### 2. Câmera (Fotos Durante Inspeção)

```bash
npm install react-camera-pro
```

```javascript
// Adicionar ao MapComponent
import { CameraComponent } from 'react-camera-pro';

<CameraComponent onCapture={(photo) => {
  // Salvar foto com GPS coordinates
}} />
```

#### 3. Modo Offline Avançado

```bash
npm install workbox-cli
```

Configurar Service Workers para:
- Cache offline
- Sincronização em background
- Notificações push

#### 4. Dark Mode

```javascript
// Adicionar ao App.jsx
const [darkMode, setDarkMode] = useState(false);

// Aplicar via CSS variables
const style = darkMode ? 'dark' : 'light';
```

## 📦 Build para Produção

### 1. Preparar

```bash
npm run build
```

### 2. Obter HTTPS

Para produção, você precisa de SSL/HTTPS:

```bash
# Usar Vercel (recomendado - grátis)
npm install -g vercel
vercel

# Ou deploy no Firebase Hosting
npm install -g firebase-tools
firebase deploy
```

### 3. PWA Manifest

Editar `public/manifest.json`:

```json
{
  "name": "Inspeção 360° do Carro",
  "short_name": "360° Carro",
  "description": "Rastreie uma volta de 360° ao redor do seu carro",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#667eea",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🧪 Testes

### Testar Localmente com Emulador

```bash
# Android Studio Emulator
# Ativar GPS no emulator e simular movimento
```

### Testar com Device Real

```bash
# 1. Conectar celular via USB
# 2. Executar React Dev Server
npm start

# 3. Acessar via IPv4 local
# adb reverse tcp:3000 tcp:3000
# Acessar: http://localhost:3000
```

## 📚 Documentação Adicional

- [Leaflet.js Docs](https://leafletjs.com/)
- [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [MDN DeviceOrientation](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)
- [jsPDF Docs](https://github.com/parallax/jsPDF)

## 📄 Licença

MIT - Livre para usar, modificar e distribuir

## 🤝 Contribuições

Sinta-se à vontade para abrir issues ou fazer pull requests!

---

**Desenvolvido com ❤️ para inspeções mais fáceis**
