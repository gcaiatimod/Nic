# Buscador de Dominios NIC.ar

Buscador de dominios argentinos integrado al sitio [Argentina.gob.ar](https://www.argentina.gob.ar). Permite buscar y consultar información de dominios `.ar` y sus variantes (`.com.ar`, `.net.ar`, `.gob.ar`, etc.).

## Funcionalidades

- Búsqueda de disponibilidad de dominios `.ar`
- Consulta de información de dominio registrado:
  - Titular y CUIT/CUIL
  - Estado del dominio
  - Fechas de registro, expiración y última modificación
  - Servidores de nombres (nameservers)
  - Estado DNSSEC
- Múltiples extensiones TLD disponibles
- Diseño adaptado al sistema de diseño Poncho de Argentina.gob.ar

## API

Utiliza la API RDAP de [nic.ar](https://rdap.nic.ar/) para consultar datos de dominios.

## Estructura de Archivos

```
├── index_NIC.html          # Página de visualización, demos y pruebas locales
├── css/
│   └── buscador-nicar.css  # Estilos específicos del componente (estilo Poncho)
├── js/
│   ├── buscador-nicar.js   # Lógica principal, manejo de API RDAP y motor de Mock Data
│   ├── tlds.json           # Configuración de TLDs y Banco de Casos de Prueba (Mock)
│   └── sw-nic-proxy.js     # Service Worker para intercepción de tráfico (opcional)
└── templates/
    └── buscador-nicar.html # Esqueleto HTML limpio para integración en otros CMS
```

## Tecnologías

- HTML5 / CSS3
- JavaScript (ES6+)
- Bootstrap 3
- Sistema de diseño [Poncho](https://github.com/argob/poncho)
## Pruebas y Datos Mock (Demos)

El buscador incluye un modo de desarrollo que utiliza datos locales para simular diferentes respuestas de la API de NIC.ar sin realizar peticiones reales. Esto permite testear todos los estados visuales del sistema de diseño Poncho de forma instantánea.

### Configuración del Modo de Desarrollo
En el archivo `js/buscador-nicar.js`, se puede alternar el origen de los datos:
- `const USE_MOCK_DATA = true;`: El sistema consumirá los datos definidos en `js/tlds.json`.
- `const USE_MOCK_DATA = false;`: El sistema realizará peticiones reales a la API RDAP (`https://rdap.nic.ar/domain/`).

### Casos de Prueba Disponibles
Para validar los diferentes estados y alertas en el entorno de desarrollo, utiliza los siguientes nombres de dominio simplificados con la extensión `.ar`:

| Categoría | Dominio | Status RDAP | Comportamiento Visual |
| :--- | :--- | :--- | :--- |
| **Disponible** | `proyecto` | `available` | Alerta Verde (Success) + Botón de registro |
| **Registrado** | `argentina` | `active` | Alerta Roja (Danger) + Detalle de Titular/Fechas |
| **Sin DNSSEC** | `google` | `active` | Alerta Roja + Aviso de falta de firma DNSSEC |
| **Transferencia**| `dominio` | `pendingTransfer` | Alerta Amarilla (Warning) de proceso en curso |
| **Bloqueado** | `bloqueado` | `locked` | Alerta Roja + Mensaje de dominio bloqueado |
| **Error Sistema**| `error` | `500` | Alerta Azul (Info) con mensaje de error del servidor |

> [!IMPORTANT]
> Los datos se cargan dinámicamente desde `js/tlds.json`. Cualquier modificación en la estructura de los datos de prueba debe reflejarse en ese archivo.