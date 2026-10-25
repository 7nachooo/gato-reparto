// Gato Reparto · service worker: la app funciona sin cobertura.
// App y librerías: primero la caché. Mapas (teselas): caché según se van viendo. Tiempos de OSRM: siempre red (si no hay, la app estima).
const V='gato-reparto-v17';
const APP=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-maskable.png','leaflet.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(APP.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='gato-tiles').map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET'||u.hostname.includes('project-osrm.org')||u.hostname.endsWith('.supabase.co'))return;   // datos y tiempos: nunca a la caché
  if(u.hostname.endsWith('tile.openstreetmap.org')){
    e.respondWith(caches.open('gato-tiles').then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok)c.put(e.request,res.clone());return res;}).catch(()=>new Response('',{status:504})))));return;}
  // la página: si hay copia, se espera a la red como mucho 2,5 s (con dos rayas de cobertura no se queda en blanco); la versión nueva se guarda igualmente para la próxima vez
  if(e.request.mode==='navigate'){
    const net=fetch(e.request).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put('index.html',cp));}return res;});
    e.waitUntil(net.then(()=>{},()=>{}));
    e.respondWith(caches.match('index.html').then(cached=>{if(!cached)return net;
      return Promise.race([net.then(r=>r.ok?r:cached,()=>cached),new Promise(r=>setTimeout(()=>r(cached),2500))]);}));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&(u.origin===location.origin||u.hostname.includes('fonts.')))caches.open(V).then(c=>c.put(e.request,res.clone()));return res;})));
});
