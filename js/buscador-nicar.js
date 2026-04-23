/**
 * ===========================================
 * JS: BUSCADOR DE DOMINIOS NIC.AR (NUEVO)
 * Compatible con Bootstrap 3.4.1 (Poncho)
 * ===========================================
 * NUEVO: Este archivo incluye datos de test embebidos (testData)
 * para desarrollo local sin necesidad de API real.
 *
 * PARA PRODUCCIÓN:
 * - Cambiar USE_MOCK_DATA = false para usar API real
 * - O usar el archivo: buscador-nic.ar.original.js
 */
(function () {
    'use strict';

    const CONFIG = {
        API_REAL_URL: 'https://rdap.nic.ar/domain/',
        TIMEOUT: 15000,
        DEBUG: false // Cambiar a true para debug
    };

    // ==============================================================
    // *NUEVO* / PARA PRODUCClON: cambiar a false y usar API real
    // ==============================================================
    const USE_MOCK_DATA = true;

    let elementos = {};
    let inicializado = false;
    let mockData = null;
    let datosNIC = null;
    let busquedaEnProceso = false;

    const FRASES_PLACEHOLDER = [
        "tu-nombre-ideal",
        "mi-proyecto-digital",
        "java-script-coffee-sip",
        "mi-emprendimiento"
    ];

    function init() {
        if (inicializado) return;

        const datosScript = document.getElementById('nic-tlds-data');
        if (datosScript) {
            try {
                datosNIC = JSON.parse(datosScript.textContent);
            } catch (e) {
                console.error('Error al parsear datos NIC:', e);
            }
        }

        elementos = {
            form: document.getElementById('form-buscar-dominio'),
            inputDominio: document.getElementById('input-dominio'),
            selectTld: document.getElementById('select-tld'),
            btnBuscar: document.getElementById('btn-buscar'),
            loader: document.getElementById('loader-dominio'),
            /* -------------------------------------------------------------------
               Loader mejorado con escudo animado
               ------------------------------------------------------------------- */
            loadingOverlay: document.getElementById('loading-overlay'),
            weatherContent: document.getElementById('weather-content'),
            resultado: document.getElementById('resultado-dominio'),
            alertResultado: document.getElementById('alert-resultado'),
            detallesDominio: document.getElementById('detalles-dominio'),
            datoDominio: document.getElementById('dato-dominio'),
            datoTitular: document.getElementById('dato-titular'),
            datoCuilCuit: document.getElementById('dato-cuil-cuit'),
            datoEstado: document.getElementById('dato-estado'),
            datoRegistro: document.getElementById('dato-registro'),
            datoExpiracion: document.getElementById('dato-expiracion'),
            datoModificacion: document.getElementById('dato-modificacion'),
            seccionNameservers: document.getElementById('seccion-nameservers'),
            listaNameservers: document.getElementById('lista-nameservers'),
            seccionDnssec: document.getElementById('seccion-dnssec'),
            avisosZona: document.getElementById('avisos-zona')
        };

        if (!elementos.form) return;

        elementos.form.addEventListener('submit', handleSubmit, false);

        if (elementos.btnBuscar) {
            elementos.btnBuscar.addEventListener('click', handleBtnClick, false);
        }

        if (elementos.inputDominio) {
            elementos.inputDominio.addEventListener('input', function () {
                this.value = this.value.trim().toLowerCase();
            });

            elementos.inputDominio.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            });

            iniciarEfectoEscritura(elementos.inputDominio, FRASES_PLACEHOLDER);
        }

        if (elementos.selectTld) {
            elementos.selectTld.addEventListener('change', function () {
                mostrarAvisosZona(this.value);
            });
            mostrarAvisosZona(elementos.selectTld.value);
        }

        inicializado = true;
    }

    /**
     * Efecto Máquina de Escribir para el placeholder
     */
    function iniciarEfectoEscritura(input, frases) {
        let fraseIndex = 0;
        let caracterIndex = 0;
        let isDeleting = false;
        let speed = 150;

        function type() {
            const currentFrase = frases[fraseIndex];

            if (isDeleting) {
                input.placeholder = currentFrase.substring(0, caracterIndex - 1);
                caracterIndex--;
                speed = 50;
            } else {
                input.placeholder = currentFrase.substring(0, caracterIndex + 1);
                caracterIndex++;
                speed = 150;
            }

            if (!isDeleting && caracterIndex === currentFrase.length) {
                isDeleting = true;
                speed = 2500;
            } else if (isDeleting && caracterIndex === 0) {
                isDeleting = false;
                fraseIndex = (fraseIndex + 1) % frases.length;
                speed = 500;
            }

            setTimeout(type, speed);
        }
        type();
    }

    function handleBtnClick(e) {
        e.preventDefault();
        handleSubmit(e);
    }

    function handleSubmit(e) {
        if (e) e.preventDefault();
        if (busquedaEnProceso) return false;
        
        const dominio = elementos.inputDominio.value.trim();
        const tld = elementos.selectTld.value;
        if (!dominio) {
            mostrarAlerta('Por favor, ingresá un nombre de dominio.', 'warning');
            return false;
        }
        if (!validarDominio(dominio)) {
            mostrarAlerta('El nombre de dominio solo puede contener letras, números y guiones.', 'danger');
            return false;
        }
        busquedaEnProceso = true;
        resetearDetalles();
        buscarDominio(dominio + tld);
        return false;
    }

    const ZONAS_PERSONAS_JURIDICAS = ['.bet.ar', '.coop.ar', '.gob.ar', '.int.ar', '.mil.ar', '.mutual.ar', '.org.ar', '.seg.ar'];
    const ZONAS_HABILITACION_ESPECIAL = ['.bet.ar', '.coop.ar', '.gob.ar', '.int.ar', '.mil.ar', '.musica.ar', '.mutual.ar', '.org.ar', '.seg.ar', '.senasa.ar', '.tur.ar'];

    function mostrarAvisosZona(tld) {
        if (!elementos.avisosZona) return;
        
        let mensajes = [];
        
        if (ZONAS_PERSONAS_JURIDICAS.indexOf(tld) !== -1) {
            mensajes.push('Recordá que estos dominios son solo para <strong>Personas Jurídicas</strong>.');
        }
        
        if (ZONAS_HABILITACION_ESPECIAL.indexOf(tld) !== -1) {
            mensajes.push('Requiere <a href="https://www.argentina.gob.ar/servicio/solicitar-la-habilitacion-de-zonas-especiales" target="_blank" rel="noopener noreferrer"><strong>Habilitación Especial</strong></a>.');
        }

        if (mensajes.length > 0) {
            let contenido = '';
            if (mensajes.length === 1) {
                contenido = mensajes[0];
            } else {
                contenido = '<ul style="margin-bottom:0; padding-left:20px;"><li>' + mensajes.join('</li><li>') + '</li></ul>';
            }
            let html = 
                '<div class="alert alert-warning">' +
                    '<div class="media">' +
                        '<div class="media-left">' +
                            '<i class="fa fa-check-circle-o fa-fw fa-4x"></i>' +
                        '</div>' +
                        '<div class="media-body">' +
                            contenido +
                        '</div>' +
                    '</div>' +
                '</div>';
            elementos.avisosZona.innerHTML = html;
            elementos.avisosZona.style.display = 'block';
        } else {
            elementos.avisosZona.innerHTML = '';
            elementos.avisosZona.style.display = 'none';
        }
    }

    function validarDominio(dominio) {
        const regex = /^[a-z0-9\-]+$/i;
        return regex.test(dominio) && !dominio.startsWith('-') && !dominio.endsWith('-');
    }

/**
     * ----------------------------------------------------------------
     * BUSCAR DOMINIO - Busca en datos mock o API real
     * ----------------------------------------------------------------
     * Para usar loader mejorado:
     *   1. Descomentar loading-overlay en HTML
     *   2. Cambiar mostrarLoader() por mostrarLoaderMejorado() y ocultarLoader() por ocultarLoaderMejorado()
     */
    function buscarDominio(dominio) {
        /* Loader simple (original) */
        mostrarLoader();
        ocultarResultados();

        // ==============================================================
        // *NUEVO* MODO: USE_MOCK_DATA = true usa datos embebidos
        // *PRODUCCIÓN*: USE_MOCK_DATA = false usa API real
        // ==============================================================
        if (USE_MOCK_DATA) {
            buscarDominioMock(dominio);
            return;
        }

        // MODO PRODUCCIÓN: Usar API real
        buscarDominioAPI(dominio);
    }

    function buscarDominioMock(dominio) {
        // Cargar datos mock del script embebido
        if (!mockData) {
            const scriptEl = document.getElementById('nic-tlds-data');
            if (scriptEl) {
                try { mockData = JSON.parse(scriptEl.textContent); }
                catch (e) { mockData = { testData: {} }; }
            } else {
                mockData = { testData: {} };
            }
        }

        const dominioLower = dominio.toLowerCase();
        const partes = dominioLower.split('.');
        const nombreDominio = partes[0];
        const tldDominio = '.' + partes.slice(1).join('.');

        // Buscar en datos mock
        let mockResultado = null;
        const categorias = ['disponible', 'registrado', 'en_transferencia', 'bloqueado', 'error'];
        for (const cat of categorias) {
            if (mockData.testData && mockData.testData[cat]) {
                mockResultado = mockData.testData[cat].find(d =>
                    d.nombre === nombreDominio && d.tld === tldDominio
                );
                if (mockResultado) break;
            }
        }

        setTimeout(() => {
            ocultarLoader();
            if (mockResultado) {
                procesarResultado(mockResultado.resultado, dominio);
            } else {
                manejarError({ message: 'DOMINIO_NO_ENCONTRADO' }, dominio);
            }
        }, 500);
    }

    function buscarDominioAPI(dominio) {
        const url = CONFIG.API_REAL_URL + dominio;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

        fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } })
            .then(response => {
                clearTimeout(timeoutId);
                if (response.ok) return response.json();
                if (response.status === 404) throw new Error('DOMINIO_NO_ENCONTRADO');
                throw new Error('ERROR_SERVIDOR');
            })
            .then(data => {
                ocultarLoader();
                procesarResultado(data, dominio);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                ocultarLoader();
                manejarError(error, dominio);
            });
    }

    // API real comentada para testing local
    function procesarResultado(data, dominio) {
        busquedaEnProceso = false;
        
        /* Ocultar loader mejorado después de procesar */
        if (elementos.loadingOverlay && elementos.weatherContent) {
            elementos.loadingOverlay.classList.remove('active');
            elementos.weatherContent.classList.remove('loading');
        }
        
        mostrarAlerta('El dominio <strong>' + dominio + '</strong> no está disponible para registarlo.', 'danger', '<i class="glyphicon glyphicon-remove" style="font-size: 2.5em;"></i>');
        mostrarDetalles(data);
    }

    function buscarDatosTitular(url) {
        // Descomentar para producción
        /*
        fetch(url, { headers: { 'Accept': 'application/json' } })
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                if (data) {
                    if (elementos.datoCuilCuit) elementos.datoCuilCuit.textContent = data.handle || '-';
                    if (elementos.datoTitular && data.vcardArray) elementos.datoTitular.textContent = extraerNombreVcard(data.vcardArray);
                }
            })
            .catch(() => {
                if (elementos.datoCuilCuit) elementos.datoCuilCuit.textContent = '-';
                if (elementos.datoTitular) elementos.datoTitular.textContent = '-';
            });
        */
    }

    function extraerNombreVcard(vcardArray) {
        try {
            const fnProperty = vcardArray[1].find(prop => prop[0] === 'fn');
            return fnProperty ? fnProperty[3] : '-';
        } catch (e) { return '-'; }
    }

    function mostrarDetalles(data) {
        if (elementos.datoTitular) elementos.datoTitular.textContent = 'Cargando...';
        if (elementos.datoCuilCuit) elementos.datoCuilCuit.textContent = 'Cargando...';
        elementos.datoDominio.textContent = data.ldhName || '-';
        const estado = (data.status && data.status[0]) ? data.status[0] : 'desconocido';
        elementos.datoEstado.innerHTML = '<span class="label ' + (estado === 'active' ? 'label-success' : 'label-default') + '">' + estado.toUpperCase() + '</span>';

        if (data.events) {
            data.events.forEach(event => {
                const fecha = formatearFecha(event.eventDate);
                if (event.eventAction === 'registration') elementos.datoRegistro.textContent = fecha;
                else if (event.eventAction === 'expiration') elementos.datoExpiracion.textContent = fecha;
                else if (event.eventAction === 'last changed') elementos.datoModificacion.textContent = fecha;
            });
        }

        if (data.nameservers && data.nameservers.length) {
            elementos.listaNameservers.innerHTML = '';
            data.nameservers.forEach(ns => {
                const li = document.createElement('li');
                li.textContent = (ns && ns.ldhName) ? ns.ldhName : '-';
                elementos.listaNameservers.appendChild(li);
            });
            elementos.seccionNameservers.style.display = 'block';
        } else {
            elementos.seccionNameservers.style.display = 'none';
            elementos.listaNameservers.innerHTML = '';
        }

        elementos.seccionDnssec.style.display = data.secureDNS && data.secureDNS.delegationSigned ? 'block' : 'none';
        elementos.detallesDominio.style.display = 'block';
        elementos.resultado.style.display = 'block';
    }

    function formatearFecha(fechaISO) {
        if (!fechaISO) return '-';
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString() + ' ' + fecha.getHours() + ':' + String(fecha.getMinutes()).padStart(2, '0') + ' hs';
    }

    function manejarError(error, dominio) {
        /* Para usar loader mejorado, cambiar a: ocultarLoaderMejorado() */
        busquedaEnProceso = false;
        
        /* Ocultar loader mejorado después de procesar */
        if (elementos.loadingOverlay && elementos.weatherContent) {
            elementos.loadingOverlay.classList.remove('active');
            elementos.weatherContent.classList.remove('loading');
        }
        
        if (error.message === 'DOMINIO_NO_ENCONTRADO') {
            mostrarTemplateDominioLibre(dominio);
        } else {
            mostrarAlerta('<strong>Error:</strong> No se pudo completar la consulta.', 'danger', '<i class="glyphicon glyphicon-exclamation-sign" style="font-size: 2.5em;"></i>');
        }
        elementos.resultado.style.display = 'block';
    }

    function mostrarTemplateDominioLibre(dominio) {
        busquedaEnProceso = false;
        const tld = elementos.selectTld.value;
        const dataLibre = datosNIC && datosNIC.estados ? datosNIC.estados['disponible'] : { 'codigo': 'DISPONIBLE', 'mensaje': 'El dominio está disponible.', 'accion': 'Registrar', 'color': 'success' };
        
        elementos.alertResultado.className = 'alert alert-' + dataLibre.color;
        elementos.alertResultado.innerHTML = 
            '<div class="media">' +
                '<div class="media-left"><i class="icono-arg-check"></i></div>' +
                '<div class="media-body">' +
                    '<p class="h4"><strong>¡' + dataLibre.codigo + '</strong></p>' +
                    '<p>El dominio <strong>' + dominio + '</strong> ' + dataLibre.mensaje + '</p>' +
                    '<p class="m-t-1"><a href="https://www.argentina.gob.ar/servicio/registrar-un-dominio-de-internet?dominio=' + encodeURIComponent(dominio) + '&tld=' + encodeURIComponent(tld) + '" target="_blank" rel="noopener noreferrer" class="btn btn-success">' + dataLibre.accion + '</a></p>' +
                '</div>' +
            '</div>';
        elementos.alertResultado.style.display = 'block';
        
        elementos.datoDominio.textContent = dominio;
        elementos.datoTitular.textContent = '-';
        elementos.datoCuilCuit.textContent = '-';
        elementos.datoEstado.innerHTML = '<span class="label label-success">' + dataLibre.codigo + '</span>';
        elementos.datoRegistro.textContent = '-';
        elementos.datoExpiracion.textContent = '-';
        elementos.datoModificacion.textContent = '-';
        
        elementos.seccionNameservers.style.display = 'none';
        elementos.listaNameservers.innerHTML = '';
        elementos.seccionDnssec.style.display = 'none';
        
        elementos.detallesDominio.style.display = 'block';
    }

function mostrarAlerta(mensaje, tipo, icono) {
        const iconos = {
            'success': '<i class="icono-arg-check"></i>',
            'danger': '<i class="icono-arg-cancel"></i>', 
            'warning': '<i class="icono-arg-warning"></i>',
            'info': '<i class="icono-arg-info"></i>'
        };
        const claseIcono = icono || iconos[tipo] || iconos['info'];
        elementos.alertResultado.className = 'alert alert-' + tipo;
        elementos.alertResultado.innerHTML = 
            '<div class="media">' +
                '<div class="media-left">' + claseIcono + '</div>' +
                '<div class="media-body">' + mensaje + '</div>' +
            '</div>';
        elementos.alertResultado.style.display = 'block';
    }

    /**
     * ----------------------------------------------------------------
     * LOADERS - Mostrar/ocultar con efecto escudo animado
     * ----------------------------------------------------------------
     */
    /* Loader original (simple) */
    function mostrarLoader() { 
        elementos.loader.style.display = 'block'; 
        elementos.btnBuscar.disabled = true; 
    }
    
    /* Loader mejorado - activar escudo animado */
    function mostrarLoaderMejorado() {
        if (elementos.loadingOverlay && elementos.weatherContent) {
            elementos.loadingOverlay.classList.add('active');
            elementos.weatherContent.classList.add('loading');
        }
        elementos.btnBuscar.disabled = true;
    }
    
    function ocultarLoader() { 
        elementos.loader.style.display = 'none'; 
        elementos.btnBuscar.disabled = false; 
        busquedaEnProceso = false; 
    }
    
    /* Loader mejorado - desactivar escudo animado */
    function ocultarLoaderMejorado() {
        if (elementos.loadingOverlay && elementos.weatherContent) {
            elementos.loadingOverlay.classList.remove('active');
            elementos.weatherContent.classList.remove('loading');
        }
        elementos.btnBuscar.disabled = false;
        busquedaEnProceso = false;
    }
    function ocultarResultados() { elementos.resultado.style.display = 'none'; }
    function resetearDetalles() {
        elementos.detallesDominio.style.display = 'none';
        elementos.datoDominio.textContent = '-';
        elementos.datoTitular.textContent = '-';
        elementos.datoCuilCuit.textContent = '-';
        elementos.datoEstado.textContent = '-';
        elementos.datoRegistro.textContent = '-';
        elementos.datoExpiracion.textContent = '-';
        elementos.datoModificacion.textContent = '-';
        elementos.seccionNameservers.style.display = 'none';
        elementos.listaNameservers.innerHTML = '';
        elementos.seccionDnssec.style.display = 'none';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();