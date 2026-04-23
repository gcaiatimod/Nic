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

## Estructura

```
├── index_NIC.html          # Página principal
├── css/
│   └── buscador-nicar.css # Estilos del buscador
├── js/
│   ├── buscador-nicar.js   # Lógica principal
│   ├── tlds.json           # Lista de TLDs disponibles
│   └── sw-nic-proxy.js     # Service worker para proxy
└── templates/
    └── buscador-nicar.html # Template del componente
```

## Tecnologías

- HTML5 / CSS3
- JavaScript (ES6+)
- Bootstrap 3
- Sistema de diseño [Poncho](https://github.com/argob/poncho)
- API RDAP