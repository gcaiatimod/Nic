/**
 * BUSCADOR DE DOMINIOS NIC.AR - Original
 * Compatible con Bootstrap 3.4.1 (Poncho)
 * NOTA: Este archivo usa la API real de NIC.ar (rdap.nic.ar)
 * Para testing local con datos mock, usar: js/buscador-nicar.js
 */
(function () {
    'use strict';

    const CONFIG = {
        API_BASE_URL: (window.NIC_RDAP_BASE_URL || 'https://rdap.nic.ar/domain/'),
        TIMEOUT: 15000
    };

    let elementos = {};
    let inicializado = false;

    const FRASES_PLACEHOLDER = [
        "tu-nombre-ideal",
        "mi-proyecto-digital",
        "java-script-coffee-sip",
        "mi-emprendimiento"
    ];

    function init() {
        if (inicializado) return;

        elementos = {
            form: document.getElementById('form-buscar-dominio'),
            inputDominio: document.getElementById('input-dominio'),
            selectTld: document.getElementById('select-tld'),
            btnBuscar: document.getElementById('btn-buscar'),
            loader: document.getElementById('loader-dominio'),
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

        elementos.form.setAttribute('onsubmit', 'return false;');
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
        e.preventDefault();
        const dominio = elementos.inputDominio.value.trim();
        const tld = elementos.selectTld.value;
        if (!dominio) {
            mostrarAlerta('Por favor, ingresá un nombre de dominio.', 'warning');
            return false;
        }
        if (!validarDominio(dominio)) {
            mostrarAlerta('El nombre de dominio solo puede contener letras, números y guiones.', 'alert alert-danger');
            return false;
        }
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
            let html = '<div class="alert alert-warning"><span class="glyphicon glyphicon-exclamation-sign"></span> ';
            if (mensajes.length === 1) {
                html += mensajes[0];
            } else {
                html += '<ul style="margin-bottom:0; padding-left:20px;"><li>' + mensajes.join('</li><li>') + '</li></ul>';
            }
            html += '</div>';
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

    function buscarDominio(dominio) {
        mostrarLoader();
        ocultarResultados();
        const url = CONFIG.API_BASE_URL + dominio;
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

    function procesarResultado(data, dominio) {
        mostrarAlerta('El dominio <strong>' + dominio + '</strong> no está disponible para registarlo.', 'alert alert-danger', 'glyphicon glyphicon-remove');
        mostrarDetalles(data);
        if (data && data.entities && data.entities[0] && data.entities[0].links && data.entities[0].links[0] && data.entities[0].links[0].href) {
            buscarDatosTitular(data.entities[0].links[0].href);
        }
    }

    function buscarDatosTitular(url) {
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
        if (error.message === 'DOMINIO_NO_ENCONTRADO') {
            mostrarAlerta('<strong>¡Libre!</strong> El dominio <strong>' + dominio + '</strong> está disponible. <br><br><a href="https://www.argentina.gob.ar/servicio/registrar-un-dominio-de-internet" target="_blank" rel="noopener noreferrer" class="btn btn-success btn-sm">Registrar</a>', 'success', 'glyphicon-ok-circle');
        } else {
            mostrarAlerta('<strong>Error:</strong> No se pudo completar la consulta.', 'alert alert-danger', 'glyphicon-exclamation-sign');
        }
        elementos.resultado.style.display = 'block';
    }

    function mostrarAlerta(mensaje, tipo, icono) {
        const claseIcono = icono || 'glyphicon-info-sign';
        elementos.alertResultado.className = 'alert alert-' + tipo;
        elementos.alertResultado.innerHTML = '<span class="glyphicon ' + claseIcono + '"></span> ' + mensaje;
        elementos.alertResultado.style.display = 'block';
    }

    function mostrarLoader() { elementos.loader.style.display = 'block'; elementos.btnBuscar.disabled = true; }
    function ocultarLoader() { elementos.loader.style.display = 'none'; elementos.btnBuscar.disabled = false; }
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