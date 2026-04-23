/**
 * Service Worker - Proxy CORS para testing local
 * Intercepta los requests a rdap.nic.ar y agrega headers CORS a la respuesta.
 * SOLO para entorno de pruebas local. No incluir en producción.
 */

const RDAP_URL = 'https://rdap.nic.ar/domain/';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    if (!url.startsWith(RDAP_URL)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                return response.arrayBuffer().then(function(body) {
                    var headers = new Headers();
                    headers.set('Access-Control-Allow-Origin', '*');
                    var ct = response.headers.get('Content-Type');
                    if (ct) headers.set('Content-Type', ct);
                    return new Response(body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: headers
                    });
                });
            })
            .catch(function() {
                return fetch(new Request(url), { mode: 'no-cors' })
                    .then(function(opaqueResponse) {
                        return new Response('{"errorCode":404,"title":"Not Found"}', {
                            status: 404,
                            statusText: 'Not Found',
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        });
                    })
                    .catch(function(networkError) {
                        return new Response(JSON.stringify({ error: networkError.message }), {
                            status: 503,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        });
                    });
            })
    );
});