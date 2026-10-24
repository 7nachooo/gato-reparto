// Gato Reparto · service worker: la app funciona sin cobertura.
// App y librerías: primero la caché. Mapas (teselas): caché según se van viendo. Tiempos de OSRM: siempre red (si no hay, la app estima).
const V='gato-reparto-v8';
const APP=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-maskable.png','leaflet.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(APP.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='gato-tiles').map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET'||u.hostname.includes('project-osrm.org')||u.hostname.endsWith('.supabase.co'))return;   // datos y tiempos: nunca a la caché
  if(u.hostname.endsWith('tile.openstreetmap.org')){
    e.respondWith(caches.open('gato-tiles').then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok)c.put(e.request,res.clone());return res;}).catch(()=>new Response('',{status:504})))));return;}
  // la página: red primero (para coger la versión nueva), caché si no hay cobertura
  if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(res=>{caches.open(V).then(c=>c.put('index.html',res.clone()));return res;}).catch(()=>caches.match('index.html')));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&(u.origin===location.origin||u.hostname.includes('fonts.')))caches.open(V).then(c=>c.put(e.request,res.clone()));return res;})));
});
