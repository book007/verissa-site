/* ═══ Verissa Template Builders + Utilities ═══ */
/* Extracted from monolithic index.html          */
/* Dependencies: translations.js must load first */

/* ══════════════════════════════════════════════════════════
   TEMPLATE BUILDERS — Based on actual Verissa templates:
   EXPRESS  = express-pensione.html (warm, traditional)
   STANDARD = hotel-aqua-mamaia-resort.html (modern resort)
   PREMIUM  = premium-wellness.html (luxury spa)
   ══════════════════════════════════════════════════════════ */

function starStr(n){return n?'★'.repeat(n)+' ':''}
/* ── Fetch timeout helper — cross-browser compatible (replaces AbortSignal.timeout) ── */
function fetchTimeout(ms){var c=new AbortController();setTimeout(function(){c.abort()},ms);return c.signal}

function bgImg(src){return `background-image:url('${src}');background-size:cover;background-position:center`}
/* ── Image URL optimizer — cap size for common CDNs ── */
function optimizeImgUrl(src,w=600){
  if(!src)return src;
  try{
    const u=new URL(src);
    /* Unsplash */
    if(u.hostname.includes('unsplash.com')){u.searchParams.set('w',String(w));u.searchParams.set('q','75');u.searchParams.set('auto','format');return u.toString()}
    /* Cloudinary */
    if(u.hostname.includes('cloudinary.com')&&u.pathname.includes('/upload/')){return src.replace('/upload/',`/upload/w_${w},q_auto,f_auto/`)}
    /* imgix */
    if(u.hostname.includes('imgix.net')){u.searchParams.set('w',String(w));u.searchParams.set('auto','format,compress');return u.toString()}
    /* Booking.com */
    if(u.hostname.includes('bstatic.com')){return src.replace(/\/max\d+\//,`/max${w}/`).replace(/square\d+/,`square${w}`)}
    /* Generic: if URL already has w/width param, try to cap it */
    if(u.searchParams.has('w')&&parseInt(u.searchParams.get('w'))>w){u.searchParams.set('w',String(w));return u.toString()}
    if(u.searchParams.has('width')&&parseInt(u.searchParams.get('width'))>w){u.searchParams.set('width',String(w));return u.toString()}
  }catch(e){}
  return src;
}
const HERO_FALLBACK='images/W-Budapest_326-Cool-Corner_09-HERO.jpg';
function isHeroPoor(src){if(!src)return true;if(src.includes('favicon'))return true;if(src.includes('logo'))return true;if(src.includes('icon'))return true;if(src.length<10)return true;return false}
function heroImg(src){return isHeroPoor(src)?HERO_FALLBACK:src}
function isPlaceholder(src){return src&&(src.includes('unsplash.com')||src===HERO_FALLBACK||src.includes('W-Budapest'))}
function placeholderBadge(src){return isPlaceholder(src)?'<div style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);color:rgba(255,255,255,.8);padding:4px 10px;border-radius:4px;font-size:9px;letter-spacing:.5px;text-transform:uppercase;z-index:2;pointer-events:none">Immagine indicativa</div>':''}
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;').replace(/"/g,'&quot;')}

/* ── Clean room descriptions: strip JS code, carousel markup, and non-room junk ── */
function cleanDesc(s){
  if(!s) return '';
  s=s.replace(/<script[\s\S]*?<\/script>/gi,'');
  s=s.replace(/\$\s*\([\s\S]*?\)\s*;?\s*/g,'');
  s=s.replace(/\b(document|window|jQuery|\$)\.[a-zA-Z]+\([^)]*\)\s*;?\s*/g,'');
  s=s.replace(/\{[^{}]*\}/g,'');
  s=s.replace(/<[^>]+>/g,' ');
  s=s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&eacute;/g,'é').replace(/&egrave;/g,'è').replace(/&agrave;/g,'à').replace(/&ograve;/g,'ò').replace(/&ugrave;/g,'ù');
  s=s.replace(/\s+/g,' ').trim();
  if(s.length<10) return '';
  if(s.length>300) s=s.slice(0,297)+'...';
  return s;
}

/* ── Filter junk images: icons, logos, sprites, tiny UI elements ── */
function isJunkImage(url){
  if(!url) return true;
  const lc=url.toLowerCase();
  /* Known junk patterns in URL */
  const junkPatterns=[
    'wifi','tripadvisor','tripadviser','booking.com/badge','logo','icon','favicon',
    'sprite','pixel','tracking','badge','rating','star','flag','banner',
    'btn','button','arrow','check','close','menu','hamburger','search',
    'facebook','twitter','instagram','linkedin','youtube','pinterest','tiktok',
    'social','share','whatsapp','telegram','email-icon','phone-icon',
    'payment','visa','mastercard','amex','paypal','stripe',
    '.svg','1x1','spacer','blank','transparent','placeholder',
    'captcha','recaptcha','widget','plugin','addon'
  ];
  if(junkPatterns.some(p=>lc.includes(p))) return true;
  /* Reject data URIs (usually tiny icons) */
  if(lc.startsWith('data:')) return true;
  /* Reject very small dimension hints in URL */
  const sizeMatch=lc.match(/[?&/](?:w|width|h|height)[=_](\d+)/i);
  if(sizeMatch&&parseInt(sizeMatch[1])<80) return true;
  /* Reject known tiny image patterns */
  if(/\b(\d+)x(\d+)\b/.test(lc)){
    const m=lc.match(/\b(\d+)x(\d+)\b/);
    if(m&&parseInt(m[1])<80&&parseInt(m[2])<80) return true;
  }
  return false;
}

/* ── Filter image arrays before template consumption ── */
function filterImages(imgs){
  if(!imgs||!imgs.length) return imgs;
  return imgs.filter(url=>!isJunkImage(url));
}

/* ── EXPRESS — Warm & Light · Cormorant Garamond + DM Sans · Terracotta accent ──
   6 sections: Hero + About + Rooms + Location + Contact + Footer · WhatsApp FAB · No chatbot */
function buildExpress(d){
  const defaultRmNames=['Camera Classic','Camera Superior','Junior Suite','Camera Deluxe','Suite Familiare','Camera Panoramica','Camera Comfort','Suite Executive','Camera Garden'];
  const defaultRmDesc=['Comfort e tradizione in un ambiente accogliente con vista giardino.','Più spazio, minibar e un balcone privato con vista panoramica.','Soggiorno separato, arredi raffinati e servizio dedicato.','Ampia e luminosa, ideale per un soggiorno di relax totale.','Perfetta per famiglie, con spazio extra e ogni comfort.','Vista mozzafiato e atmosfera unica per momenti speciali.','Accogliente e funzionale, tutto ciò che serve per un soggiorno perfetto.','Eleganza e privacy con area living dedicata.','Affaccio sul giardino, tranquillità e natura a portata di mano.'];
  const defaultRmAmn=[['2 ospiti','WiFi','A/C'],['2 ospiti','WiFi','Balcone'],['3 ospiti','WiFi','Minibar'],['2 ospiti','WiFi','A/C'],['4 ospiti','WiFi','Balcone'],['2 ospiti','WiFi','Minibar'],['2 ospiti','WiFi','A/C'],['2 ospiti','WiFi','Balcone'],['2 ospiti','WiFi','A/C']];
  const defaultRmPrices=['Da €89','Da €119','Da €149','Da €169','Da €189','Da €209','Da €99','Da €229','Da €109'];
  /* Build structured room array: merge scraped data with defaults */
  const hasStructuredRooms=d.rooms&&d.rooms.length&&typeof d.rooms[0]==='object'&&d.rooms[0].name;
  const roomCount=Math.max(hasStructuredRooms?d.rooms.length:0,Math.min(d.images.length-1,9));
  const roomsArr=[];
  for(let ri=0;ri<Math.max(roomCount,3);ri++){
    const sr=hasStructuredRooms&&d.rooms[ri]?d.rooms[ri]:{};
    const legacyName=(typeof d.rooms[ri]==='string')?d.rooms[ri]:'';
    /* v5.0: prefer room-specific image, then room.images[0], then general gallery */
    const _ri0=sr.image||(sr.images&&sr.images.length?sr.images[0]:'')||d.images[ri+1]||'';
    const roomImg=isJunkImage(_ri0)?'':_ri0;
    roomsArr.push({
      name:sr.name||legacyName||defaultRmNames[ri]||'Camera '+(ri+1),
      desc:cleanDesc(sr.description)||defaultRmDesc[ri]||'Comfort e relax nel cuore della struttura.',
      amenities:sr.amenities&&sr.amenities.length?sr.amenities:defaultRmAmn[ri]||['2 ospiti','WiFi','A/C'],
      image:roomImg,
      images:sr.images||[],
      price:sr.price||d.prices[ri]||(defaultRmPrices[ri]+'/notte'),
      sqm:sr.sqm||'',
      occupancy:sr.occupancy||''
    });
  }
  /* Legacy aliases for template below */
  const rm=roomsArr.map(r=>r.name);
  const rmDesc=roomsArr.map(r=>r.desc);
  const rmAmn=roomsArr.map(r=>r.amenities);
  const amnIcons=[
    '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>'
  ];
  function amnIcon(label){if(label.match(/ospiti|guest/i))return amnIcons[0];if(label.match(/wifi|tv/i))return amnIcons[1];if(label.match(/balcon/i))return amnIcons[3];return amnIcons[2]}
  const shortName=esc(d.name.split(' - ')[0].split(' | ')[0].split(' — ')[0].slice(0,35));
  const waNum=(d.phone||'').replace(/[^0-9+]/g,'');
  return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.name)} — Sito Ufficiale</title>
<meta name="description" content="${(d.desc||d.name+' — Prenota al miglior prezzo garantito').replace(/"/g,'&quot;').slice(0,160)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(d.name)} | Sito Ufficiale">
<meta property="og:description" content="${(d.desc||'Prenota direttamente per la miglior tariffa garantita').replace(/"/g,'&quot;').slice(0,160)}">
<meta property="og:image" content="${d.images[0]}">
${d.url?`<link rel="canonical" href="${d.url}">`:''}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Hotel","name":"${d.name.replace(/"/g,'\\"')}","description":"${(d.desc||'').replace(/"/g,'\\"').slice(0,200)}"${d.stars?`,"starRating":{"@type":"Rating","ratingValue":"${d.stars}"}`:''}${d.address?`,"address":{"@type":"PostalAddress","streetAddress":"${d.address.replace(/"/g,'\\"')}"}`:''}${d.phone?`,"telephone":"${d.phone}"`:''}, "image":"${d.images[0]}","priceRange":"€€"}
<\/script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#FAF9F6;--text:#2B2B2B;--muted:#7A7A7A;--light-muted:#A8A8A8;--accent:#C4724E;--accent-soft:rgba(196,114,78,.08);--border:rgba(0,0,0,.06);--card:#fff;--serif:'Cormorant Garamond',Georgia,serif;--sans:'DM Sans','Segoe UI',sans-serif}
body{font-family:var(--sans);color:var(--text);background:var(--bg);line-height:1.7;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:inherit;text-decoration:none}
.nav{display:flex;align-items:center;justify-content:space-between;padding:16px 32px;background:var(--bg);position:sticky;top:0;z-index:50;border-bottom:1px solid var(--border);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.nav-brand{font-family:var(--serif);font-size:20px;font-weight:500;letter-spacing:.02em;display:flex;align-items:center;gap:10px}
.nav-brand img{height:36px;width:auto;border-radius:4px;object-fit:contain}
.nav-mono{width:34px;height:34px;border-radius:50%;background:var(--text);color:var(--bg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;font-family:var(--sans)}
.nav-links{display:flex;gap:28px;font-size:13px;font-weight:500;color:var(--muted);letter-spacing:.3px}
.nav-links a:hover{color:var(--text)}
.nav-cta{padding:10px 24px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);letter-spacing:.3px;transition:all .25s}
.nav-cta:hover{background:#b5653f;transform:translateY(-1px)}
.hero{position:relative;height:85vh;min-height:540px;overflow:hidden}
.hero-img{position:absolute;inset:0;background-size:cover;background-position:center}
.hero-img::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.05) 0%,rgba(0,0,0,.15) 50%,rgba(0,0,0,.65) 100%)}
.hero-content{position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 48px 72px;max-width:720px;color:#fff}
.hero-stars{font-size:14px;letter-spacing:3px;color:#F0D48A;margin-bottom:12px}
.hero h1{font-family:var(--serif);font-size:clamp(36px,6vw,68px);font-weight:300;line-height:1.05;letter-spacing:-.01em;margin-bottom:16px}
.hero h1 em{font-style:italic;font-weight:300}
.hero-sub{font-size:16px;opacity:.85;line-height:1.7;max-width:480px;margin-bottom:32px}
.hero-btns{display:flex;gap:12px;flex-wrap:wrap}
.btn-primary{padding:14px 32px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .25s}
.btn-primary:hover{background:#b5653f;transform:translateY(-2px);box-shadow:0 8px 24px rgba(196,114,78,.3)}
.btn-ghost{padding:14px 32px;border:1.5px solid rgba(255,255,255,.4);background:transparent;color:#fff;border-radius:8px;font-size:14px;cursor:pointer;font-family:var(--sans);transition:all .25s}
.btn-ghost:hover{border-color:#fff;background:rgba(255,255,255,.08)}
.trust-bar{display:flex;gap:24px;margin-top:28px;font-size:12px;color:rgba(255,255,255,.7);flex-wrap:wrap}
.trust-bar span{display:flex;align-items:center;gap:6px}
section{padding:80px 24px;max-width:1100px;margin:0 auto}
.sec-label{font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--accent);text-align:center;margin-bottom:8px}
.sec-title{font-family:var(--serif);font-size:clamp(28px,4vw,42px);font-weight:400;text-align:center;color:var(--text);margin-bottom:8px}
.sec-sub{text-align:center;color:var(--muted);font-size:14px;margin-bottom:48px;max-width:680px;margin-left:auto;margin-right:auto}
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.about-photo{border-radius:16px;overflow:hidden;height:400px;position:relative}
.about-photo img{width:100%;height:100%;object-fit:cover}
.about-text h2{font-family:var(--serif);font-size:clamp(26px,3.5vw,36px);font-weight:400;margin-bottom:16px;text-align:left}
.about-text p{color:var(--muted);font-size:15px;line-height:1.8;margin-bottom:16px}
.about-features{display:flex;gap:24px;margin-top:24px;flex-wrap:wrap}
.about-feat{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:var(--text);background:var(--accent-soft);padding:8px 16px;border-radius:20px}
.about-feat svg{width:16px;height:16px;stroke:var(--accent);fill:none;stroke-width:2}
.rooms-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.room-card{border-radius:14px;overflow:hidden;background:var(--card);border:1px solid var(--border);transition:all .35s}
.room-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.08)}
.room-img{height:220px;position:relative;overflow:hidden}
.room-img img{width:100%;height:100%;object-fit:cover;display:block}
.room-price-tag{position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);color:#fff;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:500}
.room-body{padding:22px}
.room-body h3{font-family:var(--serif);font-size:20px;font-weight:400;margin-bottom:4px}
.room-body .room-desc{font-size:13px;color:var(--muted);margin-bottom:14px}
.room-amenities{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.room-amenity{font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px}
.room-amenity svg{width:14px;height:14px;stroke:var(--accent);fill:none;stroke-width:2}
.room-cta{display:inline-block;padding:10px 22px;background:var(--text);color:var(--bg);border-radius:8px;font-size:12px;font-weight:600;letter-spacing:.3px;transition:all .25s}
.room-cta:hover{background:var(--accent);transform:translateY(-1px)}
.location-wrap{background:var(--card);border-radius:20px;overflow:hidden;border:1px solid var(--border)}
.location-grid{display:grid;grid-template-columns:1fr 1fr}
.location-map{min-height:320px;background:#e8e4de;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--muted)}
.location-info{padding:48px;display:flex;flex-direction:column;justify-content:center}
.location-info h3{font-family:var(--serif);font-size:24px;font-weight:400;margin-bottom:20px}
.distance-list{list-style:none;padding:0}
.distance-list li{display:flex;align-items:center;gap:10px;padding:10px 0;font-size:14px;color:var(--muted);border-bottom:1px solid var(--border)}
.distance-list li:last-child{border-bottom:none}
.distance-list svg{width:18px;height:18px;stroke:var(--accent);fill:none;stroke-width:2;flex-shrink:0}
.distance-list strong{color:var(--text);font-weight:500}
.contact-card{background:var(--card);border-radius:20px;padding:56px 48px;text-align:center;border:1px solid var(--border)}
.contact-row{display:flex;justify-content:center;gap:40px;margin-top:32px;flex-wrap:wrap}
.contact-item{display:flex;flex-direction:column;align-items:center;gap:8px}
.contact-icon{width:48px;height:48px;border-radius:50%;background:var(--accent-soft);display:flex;align-items:center;justify-content:center}
.contact-icon svg{width:20px;height:20px;stroke:var(--accent);fill:none;stroke-width:2}
.contact-item span{font-size:13px;color:var(--muted)}
.contact-item strong{font-size:15px;font-weight:500}
.wa-float{position:fixed;bottom:24px;right:24px;width:56px;height:56px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(37,211,102,.35);z-index:90;transition:transform .25s}
.wa-float:hover{transform:scale(1.08)}
.wa-float svg{width:28px;height:28px;fill:#fff}
.footer{text-align:center;padding:40px 24px 32px;font-size:12px;color:var(--light-muted);border-top:1px solid var(--border)}
.footer strong{color:var(--muted)}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}
.reveal.visible{opacity:1;transform:none}
@media(max-width:768px){
body{padding-top:48px}
.nav{padding:12px 16px;top:48px}.nav-links{display:none}.hero{height:70vh;min-height:420px}.hero-content{padding:0 20px 40px}.hero h1{font-size:clamp(28px,7vw,42px)}.hero-sub{font-size:13px}.trust-bar{gap:10px;font-size:11px}section{padding:48px 16px}.about-grid{grid-template-columns:1fr;gap:24px}.about-photo{height:220px}.rooms-grid{grid-template-columns:1fr}.room-img{height:180px}.location-grid{grid-template-columns:1fr}.location-map{min-height:180px}.location-info{padding:28px 20px}.contact-card{padding:36px 20px}.contact-row{gap:20px;flex-direction:column;align-items:center}.wa-float{width:48px;height:48px;bottom:16px;right:16px}.wa-float svg{width:24px;height:24px}
}
@media(max-width:480px){.hero-btns{flex-direction:column}.btn-primary,.btn-ghost{width:100%;text-align:center}.about-features{gap:8px}.hero h1{font-size:24px}.nav-cta{padding:6px 12px;font-size:11px}}
</style></head><body>
<nav class="nav">
  <div class="nav-brand">${d.logo&&!d.logo.includes('favicon')?`<img src="${d.logo}" alt="${esc(d.name)}">`:`<span class="nav-mono">${d.name.slice(0,2).toUpperCase()}</span>`} ${shortName}</div>
  <div class="nav-links"><a href="javascript:void(0)">Chi siamo</a><a href="javascript:void(0)">Camere</a><a href="javascript:void(0)">Posizione</a><a href="javascript:void(0)">Contatti</a></div>
  <button class="nav-cta" onclick="return false">Prenota Ora</button>
</nav>
<section class="hero">
  <div class="hero-img" style="${bgImg(heroImg(d.images[0]))}">${placeholderBadge(heroImg(d.images[0]))}</div>
  <div class="hero-content">
    ${d.stars?`<div class="hero-stars">${starStr(d.stars)}</div>`:''}
    <h1>${d.headline||d.name.split(' ').slice(0,3).join(' ')+' <em>'+(d.name.split(' ').slice(3).join(' ')||'vi aspetta')+'</em>'}</h1>
    <p class="hero-sub">${d.headline?d.name+(d.desc?' — '+d.desc.slice(0,120):''):(d.desc||"Un'accoglienza autentica dove ogni dettaglio racconta la nostra storia e la passione per l'ospitalità.")}</p>
    <div class="hero-btns">
      <button class="btn-primary">Prenota al Miglior Prezzo</button>
      <button class="btn-ghost" onclick="return false">Scopri le Camere ↓</button>
    </div>
    <div class="trust-bar">
      <span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Miglior Prezzo Garantito</span>
      <span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Cancellazione Gratuita</span>
      <span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Assistenza 24/7</span>
    </div>
  </div>
</section>
<section id="chi-siamo" class="reveal">
  <div class="about-grid">
    <div class="about-photo">
      <img src="${d.images[Math.min(1,d.images.length-1)]}" alt="${esc(d.name)} interni" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80'">
    </div>
    <div class="about-text">
      <div class="sec-label">Chi Siamo</div>
      <h2>Un'ospitalità che racconta una storia</h2>
      <p>${d.aboutText||d.desc||"Benvenuti nella nostra struttura. Situati in una posizione privilegiata, offriamo un'esperienza unica dove il comfort moderno incontra la tradizione italiana."}</p>
      ${d.aboutText?'':'<p>Ogni camera è stata progettata con cura per garantire il massimo relax e un soggiorno indimenticabile.</p>'}
      <div class="about-features">
        ${d.highlights&&d.highlights.length?d.highlights.slice(0,3).map(h=>`<div class="about-feat"><svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#C4724E;fill:none;stroke-width:2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ${esc(h)}</div>`).join(''):`<div class="about-feat"><svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#C4724E;fill:none;stroke-width:2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Ospitalità familiare</div>
        <div class="about-feat"><svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#C4724E;fill:none;stroke-width:2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Posizione unica</div>
        <div class="about-feat"><svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#C4724E;fill:none;stroke-width:2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Colazione inclusa</div>`}
      </div>
    </div>
  </div>
</section>
<section id="camere" class="reveal">
  <div class="sec-label">Le Camere</div>
  <h2 class="sec-title">Comfort per ogni esigenza</h2>
  <p class="sec-sub">Ogni camera è pensata per offrirvi il massimo relax. Scegliete quella che fa per voi.</p>
  <div class="rooms-grid">
    ${roomsArr.slice(0,9).map((room,i)=>{const img=room.image||d.images[i+1]||d.images[0];const optImg=optimizeImgUrl(img);return `<div class="room-card">
      <div class="room-img">
        <img src="${optImg}" alt="${esc(room.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75'">
        ${placeholderBadge(img)}
        <span class="room-price-tag">${room.price.includes('/')?room.price:room.price+'/notte'}</span>
      </div>
      <div class="room-body">
        <h3>${esc(room.name)}</h3>
        <p class="room-desc">${esc(room.desc)}</p>
        <div class="room-amenities">${room.amenities.slice(0,3).map(a=>`<span class="room-amenity">${amnIcon(a)} ${a}</span>`).join('')}</div>
        <a href="javascript:void(0)" class="room-cta">Prenota →</a>
      </div>
    </div>`}).join('')}
  </div>
</section>
<section id="posizione" class="reveal">
  <div class="sec-label">Dove Siamo</div>
  <h2 class="sec-title">Una posizione privilegiata</h2>
  <p class="sec-sub">Nel cuore della zona, a pochi passi da tutto ciò che conta.</p>
  <div class="location-wrap">
    <div class="location-grid">
      <div class="location-map">${d.mapQuery?`<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(d.mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style="border:0;min-height:320px" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`:d.address?`<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(d.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style="border:0;min-height:320px" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`:`<span>🗺 Mappa interattiva</span>`}</div>
      <div class="location-info">
        <h3>Come raggiungerci</h3>
        <ul class="distance-list">
          <li><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.08 5.18 2 2 0 015.11 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 11.91a16 16 0 006 6l2.27-2.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg><div><strong>Centro città</strong> — 5 minuti a piedi</div></li>
          <li><svg viewBox="0 0 24 24"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg><div><strong>Stazione FS</strong> — 10 minuti in auto</div></li>
          <li><svg viewBox="0 0 24 24"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg><div><strong>Aeroporto</strong> — 45 minuti</div></li>
          <li><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg><div><strong>${d.address?esc(d.address.split(',')[0]):'Attrazioni'}</strong> — 2 minuti a piedi</div></li>
        </ul>
      </div>
    </div>
  </div>
</section>
<section id="contatti" class="reveal">
  <div class="contact-card">
    <div class="sec-label">Contatti</div>
    <h2 class="sec-title">Siamo qui per voi</h2>
    <p class="sec-sub">Avete domande o desiderate prenotare? Contattateci come preferite.</p>
    <div class="contact-row">
      ${d.phone?`<div class="contact-item"><div class="contact-icon"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.08 5.18 2 2 0 015.11 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 11.91a16 16 0 006 6l2.27-2.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></div><span>Telefono</span><strong>${d.phone}</strong></div>`:''}
      ${d.email?`<div class="contact-item"><div class="contact-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><span>Email</span><strong>${d.email}</strong></div>`:''}
      ${d.address?`<div class="contact-item"><div class="contact-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div><span>Indirizzo</span><strong>${esc(d.address)}</strong></div>`:''}
    </div>
  </div>
</section>
<footer class="footer">© 2026 ${esc(d.name)} · Sito realizzato da <strong>Verissa</strong></footer>
<a href="https://wa.me/${waNum}" class="wa-float" aria-label="Scrivici su WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.94-.27-.1-.46-.14-.65.14s-.75.94-.92 1.13c-.17.19-.34.22-.63.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.65-1.57-.89-2.15-.24-.57-.48-.49-.65-.5h-.56c-.19 0-.51.07-.77.36-.27.29-1.02 1-1.02 2.43 0 1.44 1.05 2.83 1.19 3.02.14.19 2.06 3.14 4.99 4.4.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.27-.19-.56-.34z"/><path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.47 3.44 1.28 4.88L2 22l5.22-1.25A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.67 0-3.24-.5-4.55-1.34l-.33-.2-3.09.74.77-3.01-.22-.35A7.96 7.96 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/></svg>
</a>
<script>
var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})},{threshold:.12});
document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el)});
document.querySelectorAll('img,[style*="background-image"]').forEach(function(el){if(el.tagName==='IMG'){el.onerror=function(){this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';this.alt='Immagine non disponibile'}}else{var bg=el.style.backgroundImage;if(bg&&bg.includes('url(')){var url=bg.replace(/url\\(['"]?/,'').replace(/['"]?\\)/,'');var img=new Image();img.onerror=function(){el.style.backgroundImage="url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80')"};img.src=url}}});
<\/script>
</body></html>`;
}

/* ── STANDARD — Based on hotel-aqua-mamaia-resort.html ──
   White/blue modern resort · Inter + Fraunces · Booking bar · Gallery · 2 languages */
function buildStandard(d){
  const defaultRmNames=['Camera Classic','Camera Superior','Camera Deluxe','Junior Suite','Suite Vista Mare','Suite Presidenziale'];
  const defaultRmDesc=['Comfort moderno · WiFi · A/C','Vista giardino · Minibar · Balcone','Ampia con zona relax','Soggiorno separato · Vista','Design premium · Terrazza','Lusso totale · Jacuzzi'];
  const defaultRmPrices=['Da €99','Da €139','Da €179','Da €219','Da €269','Da €349'];
  const hasStructuredRooms=d.rooms&&d.rooms.length&&typeof d.rooms[0]==='object'&&d.rooms[0].name;
  const stdRooms=[];
  const count=Math.max(hasStructuredRooms?d.rooms.length:0,Math.min(d.images.length-1,6));
  for(let ri=0;ri<Math.max(count,3);ri++){
    const sr=hasStructuredRooms&&d.rooms[ri]?d.rooms[ri]:{};
    const legacyName=(typeof d.rooms[ri]==='string')?d.rooms[ri]:'';
    /* v5.0: prefer room-specific image, then room.images[0], then general gallery */
    const _ri0=sr.image||(sr.images&&sr.images.length?sr.images[0]:'')||d.images[ri+1]||'';
    const roomImg=isJunkImage(_ri0)?'':_ri0;
    stdRooms.push({
      name:sr.name||legacyName||defaultRmNames[ri]||'Camera '+(ri+1),
      desc:cleanDesc(sr.description)||(sr.amenities&&sr.amenities.length?sr.amenities.slice(0,3).join(' · '):defaultRmDesc[ri]||'Comfort moderno'),
      image:roomImg,
      images:sr.images||[],
      price:sr.price||d.prices[ri]||(defaultRmPrices[ri]+'/notte'),
      sqm:sr.sqm||'',
      occupancy:sr.occupancy||''
    });
  }
  /* Build services list — use scraped data or defaults */
  const defaultSvcs=[{name:'Ristorante',desc:'Cucina locale e internazionale',icon:'🍽️'},{name:'Spa & Wellness',desc:'Relax per corpo e mente',icon:'💆'},{name:'Piscina',desc:'Area piscina panoramica',icon:'🏊'},{name:'Parcheggio',desc:'Parcheggio gratuito',icon:'🅿️'},{name:'WiFi Premium',desc:'Connessione veloce ovunque',icon:'📶'},{name:'Concierge',desc:'Assistenza personalizzata',icon:'🛎️'}];
  const svcIcons={'ristorante':'🍽️','restaurant':'🍽️','spa':'💆','wellness':'💆','piscina':'🏊','pool':'🏊','parcheggio':'🅿️','parking':'🅿️','wifi':'📶','internet':'📶','concierge':'🛎️','reception':'🛎️','bar':'🍸','gym':'💪','palestra':'💪','giardino':'🌿','garden':'🌿','colazione':'☕','breakfast':'☕','aria condizionata':'❄️','ac':'❄️','lavanderia':'👔','laundry':'👔'};
  function svcIcon(name){const n=name.toLowerCase();for(const[k,v]of Object.entries(svcIcons)){if(n.includes(k))return v}return '✦'}
  const svcs=d.services&&d.services.length?d.services.slice(0,6).map(s=>({name:s.name||s,desc:s.description||'',icon:svcIcon(s.name||s)})):defaultSvcs;
  return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${d.name} — Sito Ufficiale</title>
<meta name="description" content="${(d.desc||d.name+' — Prenota al miglior prezzo garantito').replace(/"/g,'&quot;').slice(0,160)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${d.name} | Sito Ufficiale">
<meta property="og:description" content="${(d.desc||'Prenota direttamente al miglior prezzo garantito').replace(/"/g,'&quot;').slice(0,120)}">
<meta property="og:image" content="${d.images[0]}">
<link rel="canonical" href="${d.url}">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Hotel","name":"${d.name.replace(/"/g,'\\"')}","starRating":{"@type":"Rating","ratingValue":"${d.stars||3}"},"address":{"@type":"PostalAddress","addressLocality":"${(d.address||'Italia').replace(/"/g,'\\"')}"},"telephone":"${d.phone||''}","email":"${d.email||''}","image":"${d.images[0]}","priceRange":"€€"}<\/script>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;color:#0A1628;line-height:1.6;background:#F8FAFB}
.serif{font-family:'Fraunces',serif}
nav{display:flex;justify-content:space-between;align-items:center;padding:14px 32px;background:rgba(248,250,251,.95);backdrop-filter:blur(12px);position:sticky;top:0;z-index:20;border-bottom:1px solid rgba(0,0,0,.06)}
nav .logo{font-family:'Fraunces',serif;font-size:18px;font-weight:500;display:flex;align-items:center;gap:10px}
nav .logo .mono{width:32px;height:32px;border-radius:50%;background:#0A1628;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600}
nav .links{display:flex;gap:24px;font-size:13px;color:#5B6B80}
nav .links a{color:inherit;text-decoration:none}
.btn-book{padding:10px 22px;background:linear-gradient(135deg,#1B7FE3,#1565C0);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(27,127,227,.25)}
.hero{position:relative;height:84vh;min-height:560px;background-size:cover;background-position:center}
.hero-ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(10,22,40,.1),rgba(10,22,40,.5));display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:48px;text-align:center;color:#fff}
.hero-ov h1{font-family:'Fraunces',serif;font-size:clamp(36px,5vw,56px);font-weight:400;letter-spacing:-.02em;margin-bottom:8px}
.hero-ov p{font-size:16px;opacity:.8;max-width:480px;margin-bottom:24px}
.booking-bar{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;padding:14px 20px;background:rgba(255,255,255,.12);backdrop-filter:blur(20px);border-radius:12px;border:1px solid rgba(255,255,255,.2)}
.booking-bar input,.booking-bar select{padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;font-size:13px;font-family:inherit;outline:none}
.booking-bar input::placeholder{color:rgba(255,255,255,.6)}
section{padding:72px 24px;max-width:1100px;margin:0 auto}
h2{font-family:'Fraunces',serif;font-size:clamp(28px,4vw,40px);font-weight:400;text-align:center;margin-bottom:8px}
.sub{text-align:center;color:#5B6B80;font-size:14px;margin-bottom:36px}
.gallery{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:8px;border-radius:16px;overflow:hidden;height:460px}
.gallery>div{background-size:cover;background-position:center;transition:all .5s}
.gallery>div:first-child{grid-row:span 2}
.gallery>div:hover{filter:brightness(1.05);transform:scale(1.01)}
.rooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.room{border-radius:14px;overflow:hidden;background:#fff;border:1px solid rgba(0,0,0,.06);transition:all .3s}
.room:hover{transform:translateY(-6px);box-shadow:0 20px 56px rgba(10,22,40,.08)}
.room .img{height:220px;position:relative;overflow:hidden}
.room .badge{position:absolute;top:12px;right:12px;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);color:#fff;padding:5px 12px;border-radius:6px;font-size:11px;font-weight:600;z-index:1}
.room .body{padding:20px}
.room .body h3{font-family:'Fraunces',serif;font-size:18px;font-weight:400;margin-bottom:4px}
.room .body .desc{font-size:13px;color:#5B6B80}
.room .body .bottom{display:flex;justify-content:space-between;align-items:center;margin-top:14px}
.room .body .price{font-family:'Fraunces',serif;font-size:20px;font-weight:500;color:#1B7FE3}
.room .body .book{padding:8px 18px;border:1.5px solid #0A1628;border-radius:8px;font-size:12px;font-weight:600;background:transparent;cursor:pointer;text-decoration:none;color:#0A1628}
.features{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
.feat{padding:24px;border-radius:12px;background:#fff;border:1px solid rgba(0,0,0,.06);text-align:center}
.feat .icon{font-size:28px;margin-bottom:8px}
.feat h4{font-size:14px;font-weight:600;margin-bottom:4px}
.feat p{font-size:12px;color:#5B6B80}
.cta-box{background:linear-gradient(135deg,#0A1628,#1B3A5C);border-radius:20px;padding:56px 40px;text-align:center;color:#fff;max-width:900px;margin:0 auto}
.cta-box h2{color:#fff;margin-bottom:8px}
.cta-box p{opacity:.7;margin-bottom:20px}
footer{text-align:center;padding:40px 24px;font-size:12px;color:#5B6B80;background:#fff;border-top:1px solid rgba(0,0,0,.06)}
.lang-switch{font-size:11px;color:#5B6B80;display:flex;gap:8px;align-items:center}
.lang-switch span{cursor:pointer;padding:2px 6px;border-radius:4px}
.lang-switch .active{background:#0A1628;color:#fff}
@media(max-width:768px){
body{padding-top:48px}
nav{padding:12px 16px;position:fixed;top:48px;left:0;right:0}
nav .links{display:none}
.hero{height:70vh;min-height:400px}
.hero-ov h1{font-size:clamp(26px,7vw,36px)}
.hero-ov p{font-size:13px;max-width:300px}
.booking-bar{flex-direction:column;gap:8px;padding:12px 16px}
.booking-bar input,.booking-bar select,.booking-bar .btn-book{width:100%}
section{padding:48px 16px}
.gallery{grid-template-columns:1fr 1fr;height:280px}
.rooms{grid-template-columns:1fr}
.room .img{height:180px}
.features{grid-template-columns:1fr 1fr;gap:10px}
.feat{padding:16px}
.cta-box{padding:36px 20px;border-radius:14px}
.cta-box h2{font-size:24px}
footer{padding-bottom:80px}
}
@media(max-width:480px){
.gallery{grid-template-columns:1fr;height:auto}
.gallery>div{height:200px}
.features{grid-template-columns:1fr}
.hero-ov h1{font-size:24px}
.booking-bar{border-radius:8px}
nav .logo{font-size:15px}
}
</style></head><body>
<nav>
  <div class="logo">${d.logo&&!d.logo.includes('favicon')?`<img src="${d.logo}" alt="${d.name}" style="height:36px;width:auto;border-radius:4px;object-fit:contain">`:`<span class="mono">${d.name.slice(0,2).toUpperCase()}</span>`} ${d.name.split(' - ')[0].split(' | ')[0].split(' — ')[0].slice(0,35)}</div>
  <div class="links"><a href="javascript:void(0)">Camere</a><a href="javascript:void(0)">Galleria</a><a href="javascript:void(0)">Servizi</a><a href="javascript:void(0)">Posizione</a><a href="javascript:void(0)">Contatti</a></div>
  <div style="display:flex;align-items:center;gap:12px">
    <div class="lang-switch"><span class="active">IT</span><span>EN</span></div>
    <button class="btn-book" onclick="return false">Prenota Ora</button>
  </div>
</nav>
<section class="hero" style="${bgImg(heroImg(d.images[0]))}">
  ${placeholderBadge(heroImg(d.images[0]))}
  <div class="hero-ov">
    <h1>${starStr(d.stars)}${d.headline||d.name}</h1>
    <p>${d.headline?d.name+(d.desc?' — '+d.desc.slice(0,120):''):(d.desc||'Eleganza e comfort nel cuore dell\'Italia — il vostro soggiorno perfetto vi aspetta.')}</p>
    <div class="booking-bar">
      <input type="text" placeholder="Check-in" onfocus="this.type='date'">
      <input type="text" placeholder="Check-out" onfocus="this.type='date'">
      <select><option>2 Ospiti</option><option>1</option><option>3</option><option>4+</option></select>
      <button class="btn-book">Cerca Disponibilità</button>
    </div>
  </div>
</section>
<section id="galleria">
  <h2>La Galleria</h2>
  <p class="sub">Scopri i nostri spazi</p>
  <div class="gallery">
    ${[0,1,2,3,4].map(i=>{const gi=d.images[i]||d.images[0];return `<div style="position:relative;overflow:hidden"><img src="${optimizeImgUrl(gi)}" alt="${esc(d.name)} foto ${i+1}" loading="${i<2?'eager':'lazy'}" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75'">${placeholderBadge(gi)}</div>`}).join('')}
  </div>
</section>
<section id="camere">
  <h2>Le Nostre Camere</h2>
  <p class="sub">Comfort e stile per ogni esigenza</p>
  <div class="rooms">
    ${stdRooms.slice(0,6).map((room,i)=>{const img=room.image||d.images[i+1]||d.images[0];const optImg=optimizeImgUrl(img);return `
    <div class="room">
      <div class="img">
        <img src="${optImg}" alt="${esc(room.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75'" style="width:100%;height:100%;object-fit:cover;display:block">
        ${placeholderBadge(img)}
        ${i===1?'<div class="badge">Più Richiesta</div>':''}
      </div>
      <div class="body">
        <h3>${esc(room.name)}</h3>
        <div class="desc">${esc(room.desc)}${room.sqm?' · '+room.sqm:''}${room.occupancy?' · '+room.occupancy:''}</div>
        <div class="bottom">
          <div class="price">${room.price.includes('/')?room.price:room.price+'/notte'}</div>
          <a href="javascript:void(0)" class="book">Prenota →</a>
        </div>
      </div>
    </div>`}).join('')}
  </div>
</section>
<section id="servizi">
  <h2>I Nostri Servizi</h2>
  <p class="sub">Tutto per un soggiorno perfetto</p>
  <div class="features">
    ${svcs.map(s=>`<div class="feat"><div class="icon">${s.icon}</div><h4>${esc(s.name)}</h4><p>${esc(s.desc)}</p></div>`).join('')}
  </div>
</section>
<section id="posizione">
  <h2>Dove Siamo</h2>
  <p class="sub">Una posizione strategica per il vostro soggiorno</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,.06);background:#fff">
    <div style="min-height:320px;background:#e8e4de;display:flex;align-items:center;justify-content:center;font-size:13px;color:#888">${(d.mapQuery||d.address)?`<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(d.mapQuery||d.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style="border:0;min-height:320px" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`:`<span>🗺 Mappa interattiva</span>`}</div>
    <div style="padding:40px 32px;display:flex;flex-direction:column;justify-content:center">
      <h3 style="font-family:'Fraunces',serif;font-size:22px;font-weight:400;margin-bottom:16px">Come raggiungerci</h3>
      <div style="display:flex;flex-direction:column;gap:14px;font-size:14px;color:#5B6B80">
        <div style="display:flex;align-items:center;gap:12px"><span style="font-size:20px">🏙</span> <span><strong style="color:#0A1628">Centro città</strong> — 5 min a piedi</span></div>
        <div style="display:flex;align-items:center;gap:12px"><span style="font-size:20px">🚉</span> <span><strong style="color:#0A1628">Stazione FS</strong> — 10 min in auto</span></div>
        <div style="display:flex;align-items:center;gap:12px"><span style="font-size:20px">✈️</span> <span><strong style="color:#0A1628">Aeroporto</strong> — 45 min</span></div>
        ${d.address?`<div style="display:flex;align-items:center;gap:12px"><span style="font-size:20px">📍</span> <span><strong style="color:#0A1628">${esc(d.address.split(',')[0])}</strong></span></div>`:''}
      </div>
    </div>
  </div>
</section>
<section id="contatti">
  <div class="cta-box">
    <h2>Prenota il Tuo Soggiorno</h2>
    <p>Contattaci direttamente per le migliori tariffe garantite</p>
    ${d.phone?`<p style="font-size:20px;opacity:1;margin-bottom:8px">📞 ${d.phone}</p>`:''}
    ${d.email?`<p style="font-size:14px">✉️ ${d.email}</p>`:''}
    ${d.address?`<p style="font-size:13px;margin-top:8px">📍 ${d.address}</p>`:''}
    <button class="btn-book" style="margin-top:20px;padding:14px 32px;font-size:15px">Richiedi Preventivo</button>
  </div>
</section>
<footer>© 2026 ${d.name} · Tutti i diritti riservati · Sito realizzato da <strong>Verissa</strong></footer>

<!-- Mobile Sticky Booking Bar -->
<div class="mobile-book-bar">
  <div class="mbb-price"><span class="mbb-from">Da</span> <span class="mbb-amount">€${d.prices&&d.prices[0]?d.prices[0]:'89'}</span><span class="mbb-night">/notte</span></div>
  <a href="javascript:void(0)" class="mbb-btn">Prenota Ora</a>
</div>
<style>
.mobile-book-bar{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);padding:12px 20px;z-index:997;align-items:center;justify-content:space-between;border-top:1px solid rgba(0,0,0,.08);box-shadow:0 -4px 20px rgba(0,0,0,.06)}
.mbb-price{display:flex;align-items:baseline;gap:4px}
.mbb-from{font-size:11px;color:#5B6B80}
.mbb-amount{font-family:'Fraunces',serif;font-size:22px;font-weight:500;color:#0A1628}
.mbb-night{font-size:11px;color:#5B6B80}
.mbb-btn{padding:12px 28px;background:linear-gradient(135deg,#1B7FE3,#1565C0);color:#fff;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;white-space:nowrap;box-shadow:0 4px 16px rgba(27,127,227,.25)}
@media(max-width:768px){.mobile-book-bar{display:flex}footer{padding-bottom:80px}#posizione>div{grid-template-columns:1fr!important}.vera-fab{bottom:80px;width:48px;height:48px;right:16px;font-size:20px}.vera-welcome{bottom:140px;right:16px;max-width:220px;font-size:12px}}
</style>

<!-- WhatsApp Floating Button -->
${d.phone?`<a href="https://wa.me/${d.phone.replace(/[^0-9+]/g,'')}" target="_blank" rel="noopener" style="position:fixed;bottom:32px;left:24px;width:48px;height:48px;border-radius:50%;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(37,211,102,.35);z-index:998;transition:transform .3s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.94-.27-.1-.46-.14-.65.14s-.75.94-.92 1.13c-.17.19-.34.22-.63.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.65-1.57-.89-2.15-.24-.57-.48-.49-.65-.5h-.56c-.19 0-.51.07-.77.36-.27.29-1.02 1-1.02 2.43 0 1.44 1.05 2.83 1.19 3.02.14.19 2.06 3.14 4.99 4.4.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.27-.19-.56-.34z"/><path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.47 3.44 1.28 4.88L2 22l5.22-1.25A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.67 0-3.24-.5-4.55-1.34l-.33-.2-3.09.74.77-3.01-.22-.35A7.96 7.96 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/></svg></a>`:''}

<!-- VERA AI Concierge -->
<style>
.vera-fab{position:fixed;z-index:999;right:36px;bottom:32px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#1B7FE3,#1565C0);color:#fff;border:3px solid rgba(27,127,227,.4);cursor:pointer;box-shadow:0 4px 20px rgba(27,127,227,.35);display:flex;align-items:center;justify-content:center;font-size:24px;transition:transform .3s,box-shadow .3s;overflow:hidden;background-size:cover;background-position:center;animation:vera-breathe 3s ease-in-out infinite}
@keyframes vera-breathe{0%,100%{box-shadow:0 4px 20px rgba(27,127,227,.35),0 0 0 0 rgba(27,127,227,.3)}50%{box-shadow:0 4px 20px rgba(27,127,227,.45),0 0 18px 6px rgba(27,127,227,.15)}}
.vera-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(27,127,227,.45)}
.vera-fab .pulse{position:absolute;inset:-4px;border-radius:50%;border:2px solid rgba(27,127,227,.4);animation:vera-pulse 2s infinite}
@keyframes vera-pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.15);opacity:0}}
.vera-welcome{position:fixed;z-index:999;right:24px;bottom:104px;background:#fff;color:#1a1a1a;border:1px solid rgba(27,127,227,.15);box-shadow:0 12px 40px rgba(0,0,0,.15);border-radius:16px 16px 4px 16px;padding:14px 36px 14px 16px;max-width:260px;font-size:13px;line-height:1.5;opacity:0;transform:translateY(10px);transition:opacity .4s,transform .4s;pointer-events:none}
.vera-welcome.show{opacity:1;transform:translateY(0);pointer-events:auto}
.vera-welcome .close-wb{position:absolute;top:6px;right:8px;width:22px;height:22px;border-radius:50%;border:none;background:rgba(0,0,0,.06);color:#999;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.vera-overlay{display:none;position:fixed;inset:0;background:rgba(10,22,40,.5);backdrop-filter:blur(4px);z-index:1000;align-items:flex-end;justify-content:flex-end;padding:24px}
.vera-overlay.open{display:flex}
.vera-frame{width:380px;max-width:calc(100vw - 32px);height:520px;max-height:70vh;background:#fff;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.vera-header{background:linear-gradient(135deg,#1B7FE3,#1565C0);padding:16px 20px;display:flex;align-items:center;gap:12px}
.vera-header .avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:16px}
.vera-header .info{flex:1;color:#fff}
.vera-header .info .name{font-size:14px;font-weight:600}
.vera-header .info .status{font-size:11px;opacity:.7}
.vera-header .close{background:none;border:none;color:rgba(255,255,255,.7);font-size:20px;cursor:pointer}
.vera-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#F8FAFB}
.vera-msg{max-width:80%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.5}
.vera-msg.bot{background:#fff;border:1px solid rgba(0,0,0,.06);align-self:flex-start;border-bottom-left-radius:4px}
.vera-msg.user{background:linear-gradient(135deg,#1B7FE3,#1565C0);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.vera-quick{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 12px}
.vera-quick button{padding:6px 12px;border-radius:16px;border:1px solid #1B7FE3;background:transparent;color:#1B7FE3;font-size:11px;cursor:pointer;transition:all .2s}
.vera-quick button:hover{background:#1B7FE3;color:#fff}
.vera-input{display:flex;gap:8px;padding:12px 16px;border-top:1px solid rgba(0,0,0,.06);background:#fff}
.vera-input input{flex:1;padding:10px 14px;border-radius:20px;border:1px solid rgba(0,0,0,.1);font-size:13px;outline:none}
.vera-input input:focus{border-color:#1B7FE3}
.vera-input button{width:36px;height:36px;border-radius:50%;background:#1B7FE3;color:#fff;border:none;cursor:pointer;font-size:14px}
@media(max-width:640px){.vera-frame{width:100%;height:80vh;max-height:80vh;border-radius:20px 20px 0 0}.vera-overlay{padding:0;align-items:flex-end}}
</style>
<button class="vera-fab" onclick="openVera()" style="background-image:url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=85&auto=format&fit=crop')"><span class="pulse"></span></button>
<div class="vera-welcome" id="veraWelcome"><button class="close-wb" onclick="event.stopPropagation();document.getElementById('veraWelcome').classList.remove('show')">✕</button>Ciao! Sono Vera, la vostra assistente virtuale. Come posso aiutarvi?</div>
<script>setTimeout(()=>{const w=document.getElementById('veraWelcome');if(w)w.classList.add('show')},3000)<\/script>
<div class="vera-overlay" id="veraOverlay" onclick="if(event.target===this)closeVera()">
  <div class="vera-frame">
    <div class="vera-header">
      <div class="avatar" style="background:url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=85&auto=format&fit=crop') center/cover;border:2px solid rgba(255,255,255,.3)"></div>
      <div class="info"><div class="name">Vera</div><div class="status">Assistente Virtuale • Online</div></div>
      <button class="close" onclick="closeVera()">✕</button>
    </div>
    <div class="vera-messages" id="veraMessages"></div>
    <div class="vera-quick" id="veraQuick">
      <button onclick="veraAsk('Camere disponibili')">Camere</button>
      <button onclick="veraAsk('Come raggiungervi')">Posizione</button>
      <button onclick="veraAsk('Servizi dell hotel')">Servizi</button>
      <button onclick="veraAsk('Voglio prenotare')">Prenota</button>
    </div>
    <div class="vera-input">
      <input type="text" id="veraInput" placeholder="Chiedimi qualcosa..." onkeydown="if(event.key==='Enter')veraSend()">
      <button onclick="veraSend()">➤</button>
    </div>
  </div>
</div>
<script>
const VERA_KB=[
  {q:['camera','camere','room','stanza','disponibil'],a:'Abbiamo diverse tipologie di camere per ogni esigenza. Dalle Classic alle Suite, tutte con WiFi, A/C e servizi premium. Vuole che le mostri le opzioni disponibili?'},
  {q:['prezzo','cost','quanto','tariffa','price'],a:'Le nostre tariffe variano in base alla stagione e alla tipologia. Per il miglior prezzo garantito, le consiglio di prenotare direttamente con noi. Posso verificare la disponibilità per le sue date?'},
  {q:['prenota','book','reserv','disponibil'],a:'Sarò felice di aiutarla con la prenotazione! Può cliccare sul pulsante "Prenota Ora" in alto, oppure mi dica le date del suo soggiorno e verifico subito la disponibilità.'},
  {q:['posizione','dove','come arrivare','raggiunger','indirizzo','location','direzioni'],a:'${d.address?d.address+". ":""}Siamo facilmente raggiungibili in auto e con i mezzi pubblici. Vuole indicazioni dettagliate dalla sua posizione?'},
  {q:['servizi','service','piscina','spa','ristorante','colazione','breakfast','wifi','parcheggio'],a:'Offriamo: ristorante con cucina locale, spa & wellness, piscina, parcheggio gratuito, WiFi premium e servizio concierge personalizzato. C\'è qualcosa di specifico che le interessa?'},
  {q:['check-in','check in','orario','ora','checkin'],a:'Il check-in è dalle 14:00 e il check-out entro le 11:00. Per esigenze particolari, non esiti a contattarci — faremo il possibile per accontentarla.'},
  {q:['telefono','chiama','call','contatt','email','whatsapp'],a:'Può contattarci ${d.phone?"al "+d.phone:""} ${d.email?"o via email a "+d.email:""}. Siamo disponibili anche su WhatsApp per una risposta immediata!'},
  {q:['ciao','hello','salve','buongiorno','hey','hi'],a:'Benvenuto! 👋 Sono Vera, la sua assistente virtuale. Come posso aiutarla oggi? Posso darle informazioni su camere, servizi, o aiutarla con una prenotazione.'},
  {q:['grazie','thanks','thank'],a:'È stato un piacere! Se ha altre domande, sono sempre qui. Le auguro un meraviglioso soggiorno! 🌟'},
];
let veraOpen=false;
function openVera(){
  document.getElementById('veraOverlay').classList.add('open');
  if(!veraOpen){veraOpen=true;veraBotMsg('Benvenuto! 👋 Sono <strong>Vera</strong>, l\\'assistente virtuale di <strong>${d.name}</strong>. Come posso aiutarla oggi?')}
}
function closeVera(){document.getElementById('veraOverlay').classList.remove('open')}
function veraBotMsg(html){
  const box=document.getElementById('veraMessages');
  const div=document.createElement('div');div.className='vera-msg bot';div.innerHTML=html;
  box.appendChild(div);box.scrollTop=box.scrollHeight;
}
function veraUserMsg(text){
  const box=document.getElementById('veraMessages');
  const div=document.createElement('div');div.className='vera-msg user';div.textContent=text;
  box.appendChild(div);box.scrollTop=box.scrollHeight;
}
function veraAsk(text){veraUserMsg(text);veraRespond(text)}
function veraSend(){
  const input=document.getElementById('veraInput');
  const text=input.value.trim();if(!text)return;input.value='';
  veraUserMsg(text);veraRespond(text);
}
function veraRespond(text){
  const lower=text.toLowerCase();
  let best=null,bestScore=0;
  for(const kb of VERA_KB){const score=kb.q.filter(w=>lower.includes(w)).length;if(score>bestScore){bestScore=score;best=kb}}
  setTimeout(()=>{
    if(best){veraBotMsg(best.a)}
    else{veraBotMsg('Grazie per la domanda! Per informazioni più dettagliate, le consiglio di contattarci direttamente${d.phone?" al "+d.phone:""} o tramite il pulsante WhatsApp. Posso aiutarla con qualcos\\'altro?')}
  },600);
}
<\/script>
<script>document.querySelectorAll('img,[style*="background-image"]').forEach(el=>{if(el.tagName==='IMG'){el.onerror=function(){this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';this.alt='Immagine non disponibile'}}else{const bg=el.style.backgroundImage;if(bg&&bg.includes('url(')){const url=bg.replace(/url\\(['"]?/,'').replace(/['"]?\\)/,'');const img=new Image();img.onerror=()=>{el.style.backgroundImage='url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80)'};img.src=url}}})<\/script>
</body></html>`;
}

/* ── PREMIUM — Based on premium-wellness.html ──
   Luxury spa · Cormorant Garamond · Dark accents · Concierge persona · Booking funnel */
function buildPremium(d){
  const defaultSuiteNames=['Suite Deluxe','Suite Panoramica','Suite Spa','Suite Presidenziale','Camera Superior','Suite Giardino'];
  const defaultSuiteDesc=['Vista e comfort premium','Terrazza panoramica privata','Accesso diretto alla spa','Il lusso più esclusivo','Design contemporaneo e relax','Affaccio privato sul verde'];
  const defaultSqm=['38 m²','52 m²','45 m²','78 m²','32 m²','44 m²'];
  const defaultSuitePrices=['Da €189','Da €269','Da €349','Da €499','Da €159','Da €229'];
  const hasStructuredRooms=d.rooms&&d.rooms.length&&typeof d.rooms[0]==='object'&&d.rooms[0].name;
  const premRooms=[];
  const count=Math.max(hasStructuredRooms?d.rooms.length:0,Math.min(d.images.length-1,6));
  for(let ri=0;ri<Math.max(count,3);ri++){
    const sr=hasStructuredRooms&&d.rooms[ri]?d.rooms[ri]:{};
    const legacyName=(typeof d.rooms[ri]==='string')?d.rooms[ri]:'';
    /* v5.0: prefer room-specific image, then room.images[0], then general gallery */
    const _ri0=sr.image||(sr.images&&sr.images.length?sr.images[0]:'')||d.images[ri+1]||'';
    const roomImg=isJunkImage(_ri0)?'':_ri0;
    premRooms.push({
      name:sr.name||legacyName||defaultSuiteNames[ri]||'Suite '+(ri+1),
      desc:cleanDesc(sr.description)||defaultSuiteDesc[ri]||'Lusso e comfort',
      amenities:sr.amenities&&sr.amenities.length?sr.amenities:['WiFi','Minibar','Vista','A/C','TV 55"','Balcone'],
      image:roomImg,
      images:sr.images||[],
      price:sr.price||d.prices[ri]||(defaultSuitePrices[ri]+'/notte'),
      sqm:sr.sqm?sr.sqm:(defaultSqm[ri]||'40 m²'),
      occupancy:sr.occupancy||''
    });
  }
  /* Experiences: use scraped or defaults */
  const defaultExps=[{title:'Cucina d\'Autore',description:'Il nostro chef crea piatti che raccontano il territorio, utilizzando ingredienti locali di prima scelta. Ogni pasto è un viaggio nei sapori autentici della tradizione italiana.'},{title:'Benessere & Relax',description:'Un\'oasi di tranquillità dedicata al vostro benessere. Trattamenti personalizzati, sauna finlandese e percorsi sensoriali per rigenerare corpo e mente.'}];
  const exps=d.experiences&&d.experiences.length?d.experiences.slice(0,2):defaultExps;
  /* Reviews: use scraped or default */
  const defaultReview={text:'Un\'esperienza indimenticabile. Il personale è stato eccezionale e la vista dalla suite è mozzafiato.',author:'Ospite verificato',rating:5};
  const topReview=d.reviews&&d.reviews.length?d.reviews[0]:defaultReview;
  return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${d.name} — Esperienza Esclusiva</title>
<meta name="description" content="${(d.desc||d.name+' — Lusso autentico e ospitalità italiana d\'eccellenza').replace(/"/g,'&quot;').slice(0,160)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${d.name} | Esperienza Esclusiva">
<meta property="og:description" content="${(d.desc||'Lusso autentico e ospitalità italiana d\'eccellenza — Prenota la vostra suite').replace(/"/g,'&quot;').slice(0,120)}">
<meta property="og:image" content="${d.images[0]}">
<link rel="canonical" href="${d.url}">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Hotel","name":"${d.name.replace(/"/g,'\\"')}","starRating":{"@type":"Rating","ratingValue":"${d.stars||4}"},"address":{"@type":"PostalAddress","addressLocality":"${(d.address||'Italia').replace(/"/g,'\\"')}"},"telephone":"${d.phone||''}","email":"${d.email||''}","image":"${d.images[0]}","priceRange":"€€€"}<\/script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;color:#2A1F14;line-height:1.7;background:#FAF7F2;padding-bottom:64px}
.serif{font-family:'Cormorant Garamond',serif}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.fade{animation:fadeUp .8s ease-out forwards}
nav{display:flex;justify-content:space-between;align-items:center;padding:16px 40px;position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(250,247,242,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,0,0,.05)}
nav .logo{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;font-style:italic;letter-spacing:-.5px}
nav .links{display:flex;gap:28px;font-size:12px;font-weight:500;color:#8A7A68;letter-spacing:1.5px;text-transform:uppercase}
nav .links a{color:inherit;text-decoration:none}
.btn-lux{padding:11px 26px;background:#2A1F14;color:#FAF7F2;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.5px;transition:all .3s}
.btn-lux:hover{background:#1A1209;transform:translateY(-1px)}
.hero{position:relative;height:100vh;min-height:640px;background-size:cover;background-position:center}
.hero-ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(42,31,20,.1),rgba(42,31,20,.55));display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;padding:24px}
.hero-ov .eyebrow{font-size:11px;letter-spacing:5px;text-transform:uppercase;opacity:.6;margin-bottom:16px}
.hero-ov h1{font-family:'Cormorant Garamond',serif;font-size:clamp(40px,7vw,72px);font-weight:400;letter-spacing:-.02em;line-height:.95;margin-bottom:16px;text-shadow:0 4px 40px rgba(0,0,0,.2)}
.hero-ov .tagline{font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;opacity:.75;max-width:480px;margin-bottom:32px}
.scroll-ind{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);color:#fff;opacity:.4;font-size:10px;letter-spacing:3px;text-transform:uppercase;display:flex;flex-direction:column;align-items:center;gap:8px}
.scroll-ind::after{content:'';width:1px;height:36px;background:#fff;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:.2}50%{opacity:.7}}
.bk-sticky{position:fixed;left:0;right:0;bottom:0;z-index:30;background:rgba(255,255,255,.96);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-top:1px solid rgba(0,0,0,.08);box-shadow:0 -10px 40px -10px rgba(42,31,20,.15)}
.bk-sticky .bk-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr 1.2fr 1fr auto;align-items:center}
.bk-sticky .bk-field{padding:14px 22px;border-right:1px solid rgba(0,0,0,.06)}
.bk-sticky .bk-field:last-of-type{border-right:none}
.bk-sticky label{font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:#8A7A68;font-weight:500;display:block;margin-bottom:2px}
.bk-sticky input,.bk-sticky select{background:transparent;border:none;outline:none;font-family:'Cormorant Garamond',serif;color:#2A1F14;width:100%;font-size:17px}
.bk-sticky select option{font-family:'Inter',sans-serif;font-size:14px}
.bk-sticky .bk-btn{padding:14px 32px;background:#B5936A;color:#fff;border:none;font-size:11px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;cursor:pointer;transition:all .25s;white-space:nowrap;font-family:'Inter',sans-serif}
.bk-sticky .bk-btn:hover{background:#94733F}
.bk-sticky .bk-btn-wrap{padding:12px}
@media(max-width:768px){.bk-sticky .bk-inner{grid-template-columns:1fr 1fr;gap:0}.bk-sticky .bk-field.bk-hide-m{display:none}.bk-sticky .bk-btn-wrap{grid-column:span 2}.bk-sticky .bk-btn{width:100%}}
section{padding:80px 24px;max-width:1100px;margin:0 auto}
.sec-head{text-align:center;margin-bottom:48px}
.sec-head .ey{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#B5936A;font-weight:600;margin-bottom:8px}
.sec-head h2{font-family:'Cormorant Garamond',serif;font-size:clamp(30px,4.5vw,44px);font-weight:400;letter-spacing:-.5px;margin-bottom:8px}
.sec-head p{color:#8A7A68;font-size:14px;max-width:460px;margin:0 auto}
.masonry{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,220px);gap:12px}
.masonry>div{border-radius:12px;overflow:hidden;background-size:cover;background-position:center;transition:transform .5s}
.masonry>div:hover{transform:scale(1.02)}
@media(max-width:768px){.masonry{grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(3,180px)}}
@media(max-width:480px){.masonry{grid-template-columns:1fr;grid-template-rows:repeat(6,200px)}}
.suites{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}
.suite{border-radius:14px;overflow:hidden;background:#fff;border:1px solid rgba(0,0,0,.05);transition:all .4s}
.suite:hover{transform:translateY(-6px);box-shadow:0 24px 56px rgba(42,31,20,.08)}
.suite .img{height:220px;position:relative;overflow:hidden}
.suite .badge{position:absolute;top:14px;right:14px;background:rgba(42,31,20,.7);backdrop-filter:blur(6px);color:#FAF7F2;padding:5px 12px;border-radius:6px;font-size:10px;font-weight:600;letter-spacing:.5px;z-index:1}
.suite .body{padding:20px}
.suite .body h3{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;margin-bottom:4px}
.suite .body .desc{font-size:12px;color:#8A7A68}
.suite .body .tags{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 14px}
.suite .body .tags span{font-size:10px;padding:3px 8px;background:#FAF7F2;border-radius:4px;color:#8A7A68;border:1px solid rgba(0,0,0,.06)}
.suite .body .bot{display:flex;justify-content:space-between;align-items:center}
.suite .body .price{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:#B5936A}
.suite .body .book{padding:7px 16px;border:1.5px solid #2A1F14;border-radius:6px;font-size:11px;font-weight:600;background:transparent;cursor:pointer;color:#2A1F14;text-decoration:none;transition:all .2s}
.suite .body .book:hover{background:#2A1F14;color:#FAF7F2}
.exp-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;margin:48px 0}
.exp-grid.rev{direction:rtl}
.exp-grid.rev>*{direction:ltr}
.exp-grid .text h3{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:400;margin-bottom:12px}
.exp-grid .text p{color:#8A7A68;font-size:14px;line-height:1.9}
.exp-grid .photo{border-radius:14px;height:360px;background-size:cover;background-position:center}
.quote{background:#fff;border-radius:20px;padding:48px;text-align:center;max-width:700px;margin:0 auto;border:1px solid rgba(0,0,0,.04)}
.quote blockquote{font-family:'Cormorant Garamond',serif;font-size:22px;font-style:italic;color:#2A1F14;margin-bottom:16px;line-height:1.5}
.quote cite{font-size:12px;color:#8A7A68;font-style:normal}
.cta-wrap{position:relative;border-radius:20px;overflow:hidden;padding:80px 40px;text-align:center;color:#fff;max-width:1000px;margin:0 auto}
.cta-wrap .bg{position:absolute;inset:0;background-size:cover;background-position:center}
.cta-wrap .bg::after{content:'';position:absolute;inset:0;background:rgba(42,31,20,.72)}
.cta-wrap .ct{position:relative;z-index:1}
.cta-wrap h2{font-family:'Cormorant Garamond',serif;font-size:36px;color:#fff;margin-bottom:8px}
.cta-wrap p{opacity:.7;margin-bottom:20px}
footer{padding:48px 40px;background:#2A1F14;color:rgba(250,247,242,.4);font-size:12px}
.f-inner{max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:32px}
.f-inner .col h4{color:#FAF7F2;font-size:12px;margin-bottom:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase}
.f-inner .col p,.f-inner .col a{font-size:12px;color:rgba(250,247,242,.4);text-decoration:none;display:block;margin-bottom:5px}
.f-inner .col a:hover{color:rgba(250,247,242,.7)}
.f-bot{text-align:center;margin-top:28px;padding-top:16px;border-top:1px solid rgba(250,247,242,.08);font-size:10px}
.lang{display:flex;gap:8px;font-size:11px;color:#8A7A68}
.lang span{cursor:pointer;padding:2px 6px;border-radius:4px}
.lang .on{background:#2A1F14;color:#FAF7F2}
@media(max-width:768px){
body{padding-top:48px}
nav{padding:14px 16px;top:48px}
nav .links{display:none}
nav .logo{font-size:17px}
.hero{height:70vh;min-height:400px}
.hero-ov h1{font-size:clamp(28px,8vw,44px)}
.hero-ov .tagline{font-size:15px}
.hero-ov .eyebrow{font-size:10px}
section{padding:48px 16px}
.sec-head h2{font-size:clamp(24px,6vw,32px)}
.suites{grid-template-columns:1fr}
.suite .img{height:180px}
.exp-grid{grid-template-columns:1fr;gap:24px}
.exp-grid.rev{direction:ltr}
.exp-grid .photo{height:240px}
.exp-grid .text h3{font-size:24px}
.quote{padding:32px 20px}
.quote blockquote{font-size:18px}
.cta-wrap{padding:48px 20px;border-radius:14px}
.cta-wrap h2{font-size:26px}
footer{padding:32px 20px}
.f-inner{flex-direction:column;gap:20px}
.scroll-ind{display:none}
}
@media(max-width:480px){
.hero-ov h1{font-size:26px}
.btn-lux{padding:8px 16px;font-size:11px}
.lang{gap:4px;font-size:10px}
}
</style></head><body>
<nav>
  <div class="logo">${d.logo&&!d.logo.includes('favicon')?`<img src="${d.logo}" alt="${d.name}" style="height:40px;width:auto;object-fit:contain;margin-right:10px">`:''}<span>${d.name.split(' - ')[0].split(' | ')[0].split(' — ')[0].slice(0,35)}</span></div>
  <div class="links"><a href="javascript:void(0)">Suite</a><a href="javascript:void(0)">Esperienza</a><a href="javascript:void(0)">Galleria</a><a href="javascript:void(0)">Posizione</a><a href="javascript:void(0)">Contatti</a></div>
  <div style="display:flex;align-items:center;gap:12px">
    <div class="lang"><span class="on">IT</span><span>EN</span><span>DE</span></div>
    <button class="btn-lux" onclick="return false">Prenota Ora</button>
  </div>
</nav>
<section class="hero" style="${bgImg(heroImg(d.images[0]))}">
  ${placeholderBadge(heroImg(d.images[0]))}
  <div class="hero-ov">
    <div class="eyebrow fade">${starStr(d.stars)}${d.address||'Italia'}</div>
    <h1 class="fade">${d.headline||d.name}</h1>
    <p class="tagline fade">${d.headline?d.name+(d.desc?' — '+d.desc.slice(0,120):''):(d.desc||'Dove ogni dettaglio racconta una storia di eleganza e benessere')}</p>
    <button class="btn-lux fade" style="padding:14px 36px;font-size:14px">Scopri le Suite</button>
  </div>
  <div class="scroll-ind">Scopri</div>
</section>

<section id="galleria">
  <div class="sec-head"><div class="ey">Galleria</div><h2>I Nostri Spazi</h2><p>Ogni angolo è pensato per il vostro benessere</p></div>
  <div class="masonry">
    ${d.images.slice(0,6).map((img,i)=>`<div style="position:relative;overflow:hidden"><img src="${optimizeImgUrl(img)}" alt="${esc(d.name)} foto ${i+1}" loading="${i<2?'eager':'lazy'}" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75'">${placeholderBadge(img)}</div>`).join('')}
  </div>
</section>

<section id="suite">
  <div class="sec-head"><div class="ey">Suite & Camere</div><h2>Il Vostro Rifugio</h2><p>Eleganza e comfort in ogni dettaglio</p></div>
  <div class="suites">
    ${premRooms.slice(0,6).map((room,i)=>{const img=room.image||d.images[i+1]||d.images[0];const fb=['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80'];const finalImg=img||fb[i%2];const optImg=optimizeImgUrl(finalImg);return `
    <div class="suite">
      <div class="img"><img src="${optImg}" alt="${esc(room.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75'" style="width:100%;height:100%;object-fit:cover;display:block">${placeholderBadge(finalImg)}<div class="badge">${room.sqm}</div></div>
      <div class="body">
        <h3>${esc(room.name)}</h3>
        <div class="desc">${esc(room.desc)}</div>
        <div class="tags">${room.amenities.slice(0,4+(i%3)).map(a=>'<span>'+esc(a)+'</span>').join('')}</div>
        <div class="bot">
          <div class="price">${room.price.includes('/')?room.price:room.price+'/notte'}</div>
          <a href="javascript:void(0)" class="book">Prenota →</a>
        </div>
      </div>
    </div>`}).join('')}
  </div>
</section>

<section id="esperienza">
  <div class="sec-head"><div class="ey">Esperienza</div><h2>Oltre il Soggiorno</h2></div>
  ${exps.map((exp,i)=>{const img=d.images[Math.min(4+i,d.images.length-1)];return `<div class="exp-grid${i%2?' rev':''}">
    <div class="text"><h3>${esc(exp.title)}</h3><p>${esc(exp.description)}</p></div>
    <div class="photo" style="position:relative;overflow:hidden"><img src="${optimizeImgUrl(img)}" alt="${esc(exp.title)}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75'">${placeholderBadge(img)}</div>
  </div>`}).join('')}
</section>

<section>
  <div class="quote">
    <blockquote>"${esc(topReview.text)}"</blockquote>
    <cite>— ${esc(topReview.author)} ${'★'.repeat(topReview.rating||5)}</cite>
  </div>
</section>

<section id="posizione">
  <div class="sec-head"><div class="ey">Posizione</div><h2>Dove Trovarci</h2><p>Una posizione esclusiva per un soggiorno indimenticabile</p></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:16px;overflow:hidden;max-width:1100px;margin:0 auto;border:1px solid rgba(181,147,106,.15)">
    <div style="min-height:360px;background:#e8e4de">${(d.mapQuery||d.address)?`<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(d.mapQuery||d.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style="border:0;min-height:360px" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#8A7A68;font-size:14px">🗺 Mappa interattiva</div>`}</div>
    <div style="padding:48px 36px;display:flex;flex-direction:column;justify-content:center;background:#FAF7F2">
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:26px;color:#2A1F14;margin-bottom:20px">Come Raggiungerci</h3>
      <div style="display:flex;flex-direction:column;gap:16px;font-size:14px;color:#5B4E3F">
        <div style="display:flex;align-items:center;gap:12px"><span style="width:36px;height:36px;border-radius:50%;background:rgba(181,147,106,.12);display:flex;align-items:center;justify-content:center;font-size:16px">🏙</span><div><strong style="color:#2A1F14">Centro città</strong><br><span style="font-size:12px">5 minuti a piedi</span></div></div>
        <div style="display:flex;align-items:center;gap:12px"><span style="width:36px;height:36px;border-radius:50%;background:rgba(181,147,106,.12);display:flex;align-items:center;justify-content:center;font-size:16px">🚉</span><div><strong style="color:#2A1F14">Stazione FS</strong><br><span style="font-size:12px">10 minuti in auto</span></div></div>
        <div style="display:flex;align-items:center;gap:12px"><span style="width:36px;height:36px;border-radius:50%;background:rgba(181,147,106,.12);display:flex;align-items:center;justify-content:center;font-size:16px">✈️</span><div><strong style="color:#2A1F14">Aeroporto</strong><br><span style="font-size:12px">45 minuti</span></div></div>
        ${d.address?`<div style="display:flex;align-items:center;gap:12px"><span style="width:36px;height:36px;border-radius:50%;background:rgba(181,147,106,.12);display:flex;align-items:center;justify-content:center;font-size:16px">📍</span><div><strong style="color:#2A1F14">${esc(d.address)}</strong></div></div>`:''}
      </div>
    </div>
  </div>
</section>

<section id="contatti" style="padding:0 24px">
  <div class="cta-wrap">
    <div class="bg" style="${bgImg(d.images[0])}"></div>
    <div class="ct">
      <h2>Pronto a Vivere l'Esperienza?</h2>
      <p>Prenota direttamente per la miglior tariffa garantita</p>
      ${d.phone?`<p style="font-size:22px;opacity:1;margin-bottom:12px;font-family:'Cormorant Garamond',serif">📞 ${d.phone}</p>`:''}
      <button class="btn-lux" style="padding:14px 36px;font-size:14px;background:#B5936A">Richiedi Preventivo</button>
    </div>
  </div>
</section>

<div class="bk-sticky">
  <div class="bk-inner">
    <div class="bk-field"><label>Arrivo</label><input type="date"></div>
    <div class="bk-field"><label>Partenza</label><input type="date"></div>
    <div class="bk-field bk-hide-m"><label>Suite</label><select><option>Tutte le Suite</option>${premRooms.slice(0,4).map(r=>'<option>'+esc(r.name)+'</option>').join('')}</select></div>
    <div class="bk-field"><label>Ospiti</label><select><option>1 Ospite</option><option selected>2 Ospiti</option><option>3 Ospiti</option><option>4 Ospiti</option></select></div>
    <div class="bk-btn-wrap"><button class="bk-btn">Verifica Disponibilità</button></div>
  </div>
</div>

<footer>
  <div class="f-inner">
    <div class="col"><h4>${d.name}</h4>${d.address?`<p>📍 ${d.address}</p>`:''}${d.phone?`<p>📞 ${d.phone}</p>`:''}${d.email?`<p>✉️ ${d.email}</p>`:''}</div>
    <div class="col"><h4>Link Utili</h4><a href="javascript:void(0)">Suite & Camere</a><a href="javascript:void(0)">Ristorante</a><a href="javascript:void(0)">Spa & Wellness</a><a href="javascript:void(0)">Offerte</a></div>
    <div class="col"><h4>Informazioni</h4><a href="javascript:void(0)">Cancellazione</a><a href="javascript:void(0)">Come Raggiungerci</a><a href="javascript:void(0)">FAQ</a><a href="javascript:void(0)">Privacy</a></div>
  </div>
  <div class="f-bot">© 2026 ${d.name} · Tutti i diritti riservati · Sito realizzato da <strong style="color:rgba(250,247,242,.6)">Verissa</strong></div>
</footer>

<!-- Mobile Sticky Booking Bar — Premium -->
<div class="pmbb">
  <div class="pmbb-left"><span class="pmbb-from">A partire da</span><span class="pmbb-price">€${d.prices&&d.prices[0]?d.prices[0]:'159'}</span><span class="pmbb-night">/notte</span></div>
  <a href="${d.phone?'https://wa.me/'+d.phone.replace(/[^0-9+]/g,''):'#contatti'}" class="pmbb-btn">Prenota Suite</a>
</div>
<style>
.pmbb{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(42,31,20,.97);backdrop-filter:blur(12px);padding:14px 24px;z-index:997;align-items:center;justify-content:space-between;border-top:1px solid rgba(181,147,106,.2)}
.pmbb-left{display:flex;align-items:baseline;gap:6px}
.pmbb-from{font-size:10px;color:rgba(250,247,242,.5);text-transform:uppercase;letter-spacing:.5px}
.pmbb-price{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:#FAF7F2}
.pmbb-night{font-size:10px;color:rgba(250,247,242,.5)}
.pmbb-btn{padding:12px 28px;background:linear-gradient(135deg,#B5936A,#8B6E4E);color:#FAF7F2;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;letter-spacing:.3px;box-shadow:0 4px 16px rgba(181,147,106,.3)}
@media(max-width:768px){.pmbb{display:flex}footer{padding-bottom:80px}#posizione>div{grid-template-columns:1fr!important}.alissa-fab{bottom:122px;width:50px;height:50px;right:16px;font-size:18px}.alissa-welcome{bottom:184px;right:16px;max-width:220px;font-size:12px}}
</style>

<!-- WhatsApp Floating Button — Premium -->
${d.phone?`<a href="https://wa.me/${d.phone.replace(/[^0-9+]/g,'')}" target="_blank" rel="noopener" style="position:fixed;bottom:78px;left:28px;width:48px;height:48px;border-radius:50%;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.3);z-index:998;transition:transform .3s" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'"><svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.94-.27-.1-.46-.14-.65.14s-.75.94-.92 1.13c-.17.19-.34.22-.63.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.65-1.57-.89-2.15-.24-.57-.48-.49-.65-.5h-.56c-.19 0-.51.07-.77.36-.27.29-1.02 1-1.02 2.43 0 1.44 1.05 2.83 1.19 3.02.14.19 2.06 3.14 4.99 4.4.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.27-.19-.56-.34z"/><path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.47 3.44 1.28 4.88L2 22l5.22-1.25A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.67 0-3.24-.5-4.55-1.34l-.33-.2-3.09.74.77-3.01-.22-.35A7.96 7.96 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/></svg></a>`:''}

<!-- ALISSA AI Concierge — Premium -->
<style>
.alissa-fab{position:fixed;z-index:999;right:28px;bottom:78px;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#B5936A,#8B6E4E);color:#FAF7F2;border:3px solid rgba(181,147,106,.4);cursor:pointer;box-shadow:0 6px 24px rgba(181,147,106,.4);display:flex;align-items:center;justify-content:center;font-size:22px;transition:transform .3s,box-shadow .3s;overflow:hidden;background-size:cover;background-position:center}
.alissa-fab:hover{transform:scale(1.08) translateY(-2px);box-shadow:0 8px 32px rgba(181,147,106,.5)}
.alissa-fab .glow{position:absolute;inset:-5px;border-radius:50%;border:1.5px solid rgba(181,147,106,.3);animation:alissa-glow 3s infinite}
@keyframes alissa-glow{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.18);opacity:0}}
.alissa-welcome{position:fixed;z-index:999;right:28px;bottom:154px;background:#FAF7F2;color:#2A1F14;border:1px solid rgba(181,147,106,.2);box-shadow:0 12px 40px rgba(42,31,20,.15);border-radius:16px 16px 4px 16px;padding:14px 36px 14px 16px;max-width:260px;font-size:13px;line-height:1.5;font-family:'Cormorant Garamond',serif;font-style:italic;opacity:0;transform:translateY(10px);transition:opacity .4s,transform .4s;pointer-events:none}
.alissa-welcome.show{opacity:1;transform:translateY(0);pointer-events:auto}
.alissa-welcome .close-wb{position:absolute;top:6px;right:8px;width:22px;height:22px;border-radius:50%;border:none;background:rgba(42,31,20,.06);color:#8A7A68;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.alissa-overlay{display:none;position:fixed;inset:0;background:rgba(42,31,20,.55);backdrop-filter:blur(6px);z-index:1000;align-items:flex-end;justify-content:flex-end;padding:28px}
.alissa-overlay.open{display:flex}
.alissa-frame{width:400px;max-width:calc(100vw - 32px);height:560px;max-height:72vh;background:#FAF7F2;border-radius:24px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(42,31,20,.25)}
.alissa-header{background:linear-gradient(135deg,#2A1F14,#3D2E1F);padding:20px 24px;display:flex;align-items:center;gap:14px}
.alissa-header .avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#B5936A,#D4A96A);display:flex;align-items:center;justify-content:center;font-size:18px;color:#2A1F14;font-weight:600}
.alissa-header .info{flex:1;color:#FAF7F2}
.alissa-header .info .name{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500}
.alissa-header .info .status{font-size:10px;opacity:.5;letter-spacing:1px;text-transform:uppercase}
.alissa-header .close{background:none;border:none;color:rgba(250,247,242,.5);font-size:20px;cursor:pointer;transition:color .2s}
.alissa-header .close:hover{color:#FAF7F2}
.alissa-messages{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px}
.alissa-msg{max-width:82%;padding:12px 16px;border-radius:16px;font-size:13px;line-height:1.6}
.alissa-msg.bot{background:#fff;border:1px solid rgba(42,31,20,.06);align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.03)}
.alissa-msg.user{background:linear-gradient(135deg,#2A1F14,#3D2E1F);color:#FAF7F2;align-self:flex-end;border-bottom-right-radius:4px}
.alissa-quick{display:flex;flex-wrap:wrap;gap:8px;padding:0 20px 14px}
.alissa-quick button{padding:7px 14px;border-radius:20px;border:1px solid #B5936A;background:transparent;color:#B5936A;font-size:11px;cursor:pointer;font-weight:500;transition:all .2s;letter-spacing:.3px}
.alissa-quick button:hover{background:#B5936A;color:#FAF7F2}
.alissa-input{display:flex;gap:10px;padding:14px 20px;border-top:1px solid rgba(42,31,20,.06);background:#fff}
.alissa-input input{flex:1;padding:11px 16px;border-radius:24px;border:1px solid rgba(42,31,20,.1);font-size:13px;outline:none;font-family:'Inter',sans-serif;background:#FAF7F2}
.alissa-input input:focus{border-color:#B5936A}
.alissa-input button{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#B5936A,#8B6E4E);color:#FAF7F2;border:none;cursor:pointer;font-size:14px;transition:transform .2s}
.alissa-input button:hover{transform:scale(1.05)}
@media(max-width:640px){.alissa-frame{width:100%;height:82vh;max-height:82vh;border-radius:24px 24px 0 0}.alissa-overlay{padding:0;align-items:flex-end}}
</style>
<button class="alissa-fab" onclick="openAlissa()" style="background-image:url('https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=85&auto=format&fit=crop')"><span class="glow"></span></button>
<div class="alissa-welcome" id="alissaWelcome"><button class="close-wb" onclick="event.stopPropagation();document.getElementById('alissaWelcome').classList.remove('show')">✕</button>Benvenuto. Sono Alissa, la sua concierge virtuale. Come posso assisterla?</div>
<script>setTimeout(()=>{const w=document.getElementById('alissaWelcome');if(w)w.classList.add('show')},4000)<\/script>
<div class="alissa-overlay" id="alissaOverlay" onclick="if(event.target===this)closeAlissa()">
  <div class="alissa-frame">
    <div class="alissa-header">
      <div class="avatar" style="background:url('https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=85&auto=format&fit=crop') center/cover;border:2px solid rgba(250,247,242,.3)"></div>
      <div class="info"><div class="name">Alissa</div><div class="status">Concierge Virtuale • Online</div></div>
      <button class="close" onclick="closeAlissa()">✕</button>
    </div>
    <div class="alissa-messages" id="alissaMessages"></div>
    <div class="alissa-quick" id="alissaQuick">
      <button onclick="alissaAsk('Le vostre suite')">Suite</button>
      <button onclick="alissaAsk('Spa e benessere')">Spa</button>
      <button onclick="alissaAsk('Ristorante e cucina')">Ristorante</button>
      <button onclick="alissaAsk('Desidero prenotare')">Prenota</button>
      <button onclick="alissaAsk('Esperienze esclusive')">Esperienze</button>
    </div>
    <div class="alissa-input">
      <input type="text" id="alissaInput" placeholder="Come posso assisterla..." onkeydown="if(event.key==='Enter')alissaSend()">
      <button onclick="alissaSend()">➤</button>
    </div>
  </div>
</div>
<script>
const ALISSA_KB=[
  {q:['suite','camera','camere','room','stanza'],a:'Le nostre suite sono progettate come rifugi personali. Dalla Suite Deluxe con vista panoramica alla Suite Presidenziale con jacuzzi privata — ogni spazio racconta una storia di eleganza. Posso mostrarle la disponibilità per le sue date?'},
  {q:['spa','wellness','benessere','massaggio','trattament','sauna'],a:'Il nostro centro benessere offre un percorso sensoriale completo: sauna finlandese, bagno turco, trattamenti personalizzati con prodotti naturali e una piscina riscaldata con vista. Desidera prenotare un trattamento?'},
  {q:['ristorante','cucina','cena','pranzo','colazione','chef','menu'],a:'Il nostro chef crea ogni giorno un menu che celebra il territorio. Ingredienti locali, stagionali, preparati con tecnica raffinata. La colazione è un momento speciale con prodotti freschi selezionati ogni mattina.'},
  {q:['prenota','book','reserv','disponibil'],a:'Sarà un piacere accoglierla. Per la miglior tariffa garantita, le consiglio di prenotare direttamente con noi. Mi indichi le date e il tipo di suite preferita, e verifico immediatamente la disponibilità.'},
  {q:['prezzo','cost','quanto','tariffa','price'],a:'Le nostre tariffe riflettono un\\'esperienza senza compromessi. Prenotando direttamente con noi, le garantiamo la miglior tariffa disponibile più vantaggi esclusivi. Posso preparare un preventivo personalizzato?'},
  {q:['posizione','dove','come arrivare','raggiunger','indirizzo','location'],a:'${d.address?d.address+". ":""}Ci troviamo in una posizione privilegiata. Offriamo servizio transfer su richiesta. Posso organizzare il suo arrivo?'},
  {q:['esperienza','attività','escursion','cosa fare','evento'],a:'Offriamo esperienze curate: degustazioni private, escursioni guidate nel territorio, sessioni yoga all\\'alba e molto altro. Il nostro concierge è a disposizione per creare un itinerario su misura.'},
  {q:['check-in','check in','orario','checkout'],a:'Il check-in è dalle ore 15:00 e il check-out entro le 11:00. Per arrivi anticipati o partenze posticipate, saremo lieti di trovare una soluzione — basta comunicarcelo in anticipo.'},
  {q:['telefono','chiama','contatt','email','whatsapp'],a:'Può contattarci ${d.phone?"al "+d.phone:""} ${d.email?"o via email "+d.email:""}. Per assistenza immediata, il nostro WhatsApp è sempre attivo.'},
  {q:['ciao','hello','salve','buongiorno','hey','hi'],a:'Benvenuto. Sono Alissa, la sua concierge virtuale. È un piacere averla qui. Come posso rendere speciale il suo soggiorno?'},
  {q:['grazie','thanks','thank'],a:'Il piacere è mio. Resto a sua disposizione per qualsiasi necessità. Le auguro un\\'esperienza indimenticabile. ✨'},
  {q:['animali','pet','cane','gatto','dog'],a:'Siamo lieti di accogliere i vostri compagni a quattro zampe. Offriamo servizi dedicati per garantire il loro comfort durante il soggiorno.'},
];
let alissaStarted=false;
function openAlissa(){
  document.getElementById('alissaOverlay').classList.add('open');
  if(!alissaStarted){alissaStarted=true;alissaBotMsg('Benvenuto. ✨ Sono <strong>Alissa</strong>, la concierge virtuale di <strong>${d.name}</strong>.<br><br>Come posso rendere perfetta la sua esperienza?')}
}
function closeAlissa(){document.getElementById('alissaOverlay').classList.remove('open')}
function alissaBotMsg(html){
  const box=document.getElementById('alissaMessages');
  const div=document.createElement('div');div.className='alissa-msg bot';div.innerHTML=html;
  box.appendChild(div);box.scrollTop=box.scrollHeight;
}
function alissaUserMsg(text){
  const box=document.getElementById('alissaMessages');
  const div=document.createElement('div');div.className='alissa-msg user';div.textContent=text;
  box.appendChild(div);box.scrollTop=box.scrollHeight;
}
function alissaAsk(text){alissaUserMsg(text);alissaRespond(text)}
function alissaSend(){
  const input=document.getElementById('alissaInput');
  const text=input.value.trim();if(!text)return;input.value='';
  alissaUserMsg(text);alissaRespond(text);
}
function alissaRespond(text){
  const lower=text.toLowerCase();
  let best=null,bestScore=0;
  for(const kb of ALISSA_KB){const score=kb.q.filter(w=>lower.includes(w)).length;if(score>bestScore){bestScore=score;best=kb}}
  setTimeout(()=>{
    if(best){alissaBotMsg(best.a)}
    else{alissaBotMsg('Grazie per la sua domanda. Per un\\'assistenza personalizzata, le suggerisco di contattarci direttamente${d.phone?" al "+d.phone:""}. Il nostro team sarà lieto di assisterla. Posso aiutarla con qualcos\\'altro?')}
  },700);
}
<\/script>
<script>document.querySelectorAll('img,[style*="background-image"]').forEach(el=>{if(el.tagName==='IMG'){el.onerror=function(){this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';this.alt='Immagine non disponibile'}}else{const bg=el.style.backgroundImage;if(bg&&bg.includes('url(')){const url=bg.replace(/url\\(['"]?/,'').replace(/['"]?\\)/,'');const img=new Image();img.onerror=()=>{el.style.backgroundImage='url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80)'};img.src=url}}})<\/script>
</body></html>`;
}
