/* ═══ Verissa App — Core Logic ═══ */
/* Dependencies: translations.js, templates.js must load first */

function t(key){return LANG[currentLang][key]||LANG.it[key]||key}
function switchLang(lang){
  currentLang=lang;
  /* Update toggle buttons */
  document.querySelectorAll('.lang-btn').forEach(b=>{
    b.classList.toggle('active',b.dataset.lang===lang);
  });
  /* Static HTML elements with data-t */
  document.querySelectorAll('[data-t]').forEach(el=>{
    const k=el.getAttribute('data-t');
    const val=LANG[lang][k];
    if(val) el.innerHTML=val;
  });
  /* Placeholder attributes */
  document.querySelectorAll('[data-tp]').forEach(el=>{
    const k=el.getAttribute('data-tp');
    const val=LANG[lang][k];
    if(val) el.setAttribute('placeholder',val);
  });
  /* Page title & meta */
  document.title=t('pageTitle');
  const metaD=document.querySelector('meta[name="description"]');
  if(metaD) metaD.setAttribute('content',t('metaDesc'));
  /* html lang attribute */
  document.documentElement.lang=lang;
}

/* ══════ SCRAPER ══════ */
let hotelData=null;
let tierHTML=['','',''];

/* ═══════════════════════════════════════════════════════════════════
   VERISSA SCRAPER WORKER URL
   ─────────────────────────────────────────────────────────────────
   Deploy verissa-scraper-worker.js to Cloudflare Workers (free tier)
   Then paste your worker URL below. This enables FULL automatic
   extraction of logos, images, colors, contacts, rooms, and prices.
   ═══════════════════════════════════════════════════════════════════ */
const SCRAPER_URL='https://hhgs-scraper.alexetrofim.workers.dev'; /* LIVE — updated 2026-05-21 */

async function handleGenerate(){
  const rawUrl=document.getElementById('urlInput').value.trim();
  if(!rawUrl){
    document.getElementById('urlInput').setAttribute('placeholder',t('scrEmptyPlaceholder'));
    document.getElementById('urlInput').focus();
    return;
  }
  const url=rawUrl.startsWith('http')?rawUrl:'https://'+rawUrl;
  const eu=encodeURIComponent(url);
  const btn=document.querySelector('.btn-generate');
  const origHTML=btn.innerHTML;
  const spin='<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> ';
  btn.innerHTML=spin+t('scrLoading');
  btn.style.pointerEvents='none';

  /* Fallback hotel images — curated luxury hospitality from Unsplash */
  const FALLBACK_IMGS=[
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
    'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'
  ];

  try{
    /* ══════════════════════════════════════════════════════════════════
       ULTRA DATA EXTRACTION ENGINE v5.0 — "Deep Extraction"
       ────────────────────────────────────────────────────────────────
       Layer 0: URL Intelligence  — name from domain (instant)
       Layer 1: Verissa Scraper v5.0 — multi-page crawl + JSON-LD + OTA (~5-10s)
       Layer 2: Microlink.io      — metadata API fallback (~3-5s)
       Layer 3: CORS proxies      — last resort HTML scrape
       Layer 4: Manual input      — user enters hotel name (never fails)
       ══════════════════════════════════════════════════════════════════ */

    let hotelName='', metaDesc='', headline='', images=[], brandColor='#1a1a2e', logo='';
    let prices=[], phone='', email='', address='', mapQuery='', stars=0, rooms=[];
    let aboutText='', services=[], highlights=[], experiences=[], reviews=[], tagline='', socialLinks=[], bookingUrl='';
    let dataSource='none';
    let html='';

    /* ── LAYER 0: URL Intelligence (instant, zero network) ── */
    let domain='';
    try{
      const urlObj=new URL(url);
      domain=urlObj.hostname.replace(/^www\./,'');
      let domainName=domain.split('.')[0]
        .replace(/[-_]/g,' ')
        .replace(/hotel/gi,' hotel ')
        .replace(/\s+/g,' ').trim()
        .replace(/\b\w/g,c=>c.toUpperCase());
      if(domainName.length>3) hotelName=domainName;
    }catch(e){}

    /* ── LAYER 1: Verissa Scraper Worker (full HTML + structured extraction) ── */
    let scraperOK=false;
    let scraperBotBlocked=false;
    if(SCRAPER_URL){
      btn.innerHTML=spin+'Scansione profonda del sito...';
      try{
        const sr=await fetch(SCRAPER_URL+'/?url='+eu,{signal:fetchTimeout(30000)});
        const sj=await sr.json();
        if(sr.ok&&sj.success&&sj.data){
            const sd=sj.data;
            if(sd.name) hotelName=sd.name;
            if(sd.headline) headline=sd.headline;
            if(sd.description) metaDesc=sd.description;
            if(sd.logo) logo=sd.logo;
            if(sd.images&&sd.images.length) images=filterImages(sd.images);
            if(sd.brandColors&&sd.brandColors.length) brandColor=sd.brandColors[0];
            if(sd.phone) phone=sd.phone;
            if(sd.email) email=sd.email;
            if(sd.address) address=sd.address;
            if(sd.stars) stars=sd.stars;
            if(sd.rooms&&sd.rooms.length) rooms=sd.rooms;
            if(sd.prices&&sd.prices.length) prices=sd.prices;
            if(sd.aboutText) aboutText=sd.aboutText;
            if(sd.services&&sd.services.length) services=sd.services;
            if(sd.highlights&&sd.highlights.length) highlights=sd.highlights;
            if(sd.experiences&&sd.experiences.length) experiences=sd.experiences;
            if(sd.reviews&&sd.reviews.length) reviews=sd.reviews;
            if(sd.tagline) tagline=sd.tagline;
            if(sd.socialLinks&&Object.keys(sd.socialLinks).length) socialLinks=sd.socialLinks;
            if(sd.bookingUrl) bookingUrl=sd.bookingUrl;
            dataSource='verissa-scraper';
            scraperOK=true;
            /* v5.0 quality logging */
            const q=sd._quality||{};
            const roomsWithPrices=rooms.filter(r=>r.price).length;
            const roomsWithImages=rooms.filter(r=>r.image||r.images?.length).length;
        } else if(sj.detail&&/403|530|Forbidden/i.test(sj.detail)){
            console.warn('[Verissa] ⚠️ Sito protetto da anti-bot ('+sj.detail+') — fallback ai layer successivi');
            scraperBotBlocked=true;
        } else {
            console.warn('[Verissa] Scraper returned error:',sj.error,sj.detail||'');
        }
      }catch(e){}
    }

    /* ── LAYER 2: Microlink.io (metadata — if scraper unavailable/failed) ── */
    let microlinkOK=false;
    if(!scraperOK){
      btn.innerHTML=spin+t('scrMetadata');
      try{
        const mr=await fetch('https://api.microlink.io/?url='+eu+'&palette=true&audio=false&video=false',{signal:fetchTimeout(15000)});
        if(mr.ok){
          const mj=await mr.json();
          if(mj.status==='success'&&mj.data){
            const md=mj.data;
            if(md.title) hotelName=md.title;
            if(md.description) metaDesc=md.description;
            if(md.image&&md.image.url) images.unshift(md.image.url);
            if(md.logo&&md.logo.url&&!md.logo.url.includes('favicon')){
              logo=md.logo.url;
              images.push(md.logo.url);
            }
            if(md.image&&md.image.palette){
              const pal=md.image.palette;
              brandColor=pal.vibrant||pal.muted||pal.darkVibrant||brandColor;
            }
            dataSource='microlink';
            microlinkOK=true;
          }
        }
      }catch(e){}

      if(!microlinkOK){
        try{
          const mr2=await fetch('https://api.microlink.io/?url='+eu,{signal:fetchTimeout(10000)});
          if(mr2.ok){
            const mj2=await mr2.json();
            if(mj2.status==='success'&&mj2.data){
              if(mj2.data.title) hotelName=mj2.data.title;
              if(mj2.data.description) metaDesc=mj2.data.description;
              if(mj2.data.image&&mj2.data.image.url) images.unshift(mj2.data.image.url);
              if(mj2.data.logo&&mj2.data.logo.url) logo=mj2.data.logo.url;
              dataSource='microlink-simple';
              microlinkOK=true;
            }
          }
        }catch(e){}
      }
    }

    /* ── LAYER 3: CORS proxies — ONLY if both scraper and Microlink failed ── */
    if(!scraperOK&&!microlinkOK){
      const proxyList=[
        {name:'codetabs',url:'https://api.codetabs.com/v1/proxy?quest='+eu,timeout:15000,type:'raw'},
        {name:'allorigins-json',url:'https://api.allorigins.win/get?url='+eu,timeout:15000,type:'json'},
        {name:'allorigins-raw',url:'https://api.allorigins.win/raw?url='+eu,timeout:15000,type:'raw'},
      ];
      for(let i=0;i<proxyList.length;i++){
        if(html) break;
        const p=proxyList[i];
        btn.innerHTML=spin+'Scansione sito ('+(i+1)+'/'+proxyList.length+')...';
        try{
          const r=await fetch(p.url,{signal:fetchTimeout(p.timeout)});
          if(r.ok){
            let txt;
            if(p.type==='json'){const j=await r.json();txt=j.contents||''}
            else{txt=await r.text()}
            if(txt.length>200&&txt.includes('<')){html=txt;dataSource='proxy-'+p.name}
          }
        }catch(e){}
      }
    }

    /* ── Parse full HTML if we got it (from scraper or CORS) ── */
    if(html&&!scraperOK){
      const parser=new DOMParser();
      const doc=parser.parseFromString(html,'text/html');
      const base=new URL(url);

      // Name — prioritize og:site_name (hotel brand, not page title)
      const ogSiteName=doc.querySelector('meta[property="og:site_name"]')?.content;
      const ogTitle=doc.querySelector('meta[property="og:title"]')?.content;
      const h1=doc.querySelector('h1')?.textContent?.trim();
      const titleTag=doc.querySelector('title')?.textContent?.trim();
      let htmlName='';
      if(ogSiteName){htmlName=ogSiteName}
      else if(titleTag&&titleTag.includes(' - ')){
        const parts=titleTag.split(/\s*[-–|]\s*/);
        htmlName=parts[parts.length-1].trim();
      }else{htmlName=(ogTitle||h1||titleTag||'').replace(/\s*[-–|·].*$/,'').trim()}
      if(htmlName&&htmlName.length>3) hotelName=htmlName;

      // Description
      const htmlDesc=doc.querySelector('meta[name="description"]')?.content||
                     doc.querySelector('meta[property="og:description"]')?.content||'';
      if(htmlDesc) metaDesc=htmlDesc;

      // Logo — comprehensive extraction
      if(!logo){
        const logoSrcs=[
          doc.querySelector('[class*="logo"] img,[id*="logo"] img')?.getAttribute('src'),
          doc.querySelector('img[class*="logo"],img[id*="logo"]')?.getAttribute('src'),
          doc.querySelector('img[alt*="logo" i]')?.getAttribute('src'),
          doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
          doc.querySelector('link[rel*="icon"][sizes="192x192"],link[rel*="icon"][sizes="180x180"],link[rel*="icon"][sizes="152x152"]')?.getAttribute('href'),
        ].filter(Boolean);
        for(const s of logoSrcs){
          if(s&&!s.includes('favicon.ico')&&!s.includes('16x16')&&!s.includes('32x32')){
            logo=s.startsWith('http')?s:s.startsWith('//')?'https:'+s:s.startsWith('/')?base.origin+s:base.origin+'/'+s;
            break;
          }
        }
      }
      /* Also try schema.org logo */
      if(!logo){
        const schemaLogo=html.match(/"logo"\s*:\s*"([^"]+)"/i)?.[1]||html.match(/"logo"\s*:\s*\{\s*[^}]*"url"\s*:\s*"([^"]+)"/i)?.[1];
        if(schemaLogo) logo=schemaLogo.startsWith('http')?schemaLogo:base.origin+schemaLogo;
      }

      // Images
      const imgSet=new Set(images);
      const ogImg=doc.querySelector('meta[property="og:image"]')?.content;
      if(ogImg) imgSet.add(ogImg.startsWith('http')?ogImg:base.origin+ogImg);
      doc.querySelectorAll('img[src]').forEach(img=>{
        let s=img.getAttribute('src');
        if(!s||s.startsWith('data:')||s.length<10) return;
        if(/pixel|spacer|tracking|1x1|blank|spinner/i.test(s)) return;
        if(/logo|icon|favicon|badge|rating|star|payment|visa|master|paypal|amex/i.test(s)&&!/room|suite|camera/i.test(s)) return;
        /* Filter non-hotel product/object images by URL pattern */
        if(/product|shop|cart|appliance|kitchen|kettle|coffee-machine|gadget|widget|banner-ad|advert|promo-banner/i.test(s)) return;
        /* Filter tiny images — require meaningful dimensions */
        const w=parseInt(img.getAttribute('width'))||0;
        const h=parseInt(img.getAttribute('height'))||0;
        const nw=img.naturalWidth||0;const nh=img.naturalHeight||0;
        const rw=w||nw||999;const rh=h||nh||999;
        if(rw<200||rh<150) return;
        /* Prefer larger images — skip very small aspect ratios (banners, strips) */
        if(rw>10&&rh>10&&(rw/rh>5||rh/rw>5)) return;
        if(!s.startsWith('http')) s=s.startsWith('/')?base.origin+s:base.origin+'/'+s;
        imgSet.add(s);
      });
      doc.querySelectorAll('[style*="background"]').forEach(el=>{
        const m=el.getAttribute('style')?.match(/url\(['"]?([^'")]+)/);
        if(m&&m[1]&&!m[1].startsWith('data:')){
          let s=m[1];
          if(!s.startsWith('http')) s=s.startsWith('/')?base.origin+s:base.origin+'/'+s;
          imgSet.add(s);
        }
      });
      doc.querySelectorAll('[srcset]').forEach(el=>{
        const parts=el.getAttribute('srcset').split(',');
        let largest='',largestW=0;
        parts.forEach(p=>{
          const [u,desc]=p.trim().split(/\s+/);
          const w=parseInt(desc)||0;
          if(w>largestW){largestW=w;largest=u}
        });
        const s=largest||parts[0]?.trim().split(/\s+/)[0];
        if(s&&!s.startsWith('data:')){
          imgSet.add(s.startsWith('http')?s:s.startsWith('/')?base.origin+s:base.origin+'/'+s);
        }
      });
      images=[...imgSet].slice(0,20);

      // Colors — theme-color, CSS vars, inline styles
      const themeColor=doc.querySelector('meta[name="theme-color"]')?.content;
      if(themeColor) brandColor=themeColor;
      if(brandColor==='#1a1a2e'){
        /* Look for primary color in CSS */
        const colorMatch=html.match(/--(?:primary|brand|main|accent)[-\w]*\s*:\s*(#[0-9a-fA-F]{3,8})/i);
        if(colorMatch) brandColor=colorMatch[1];
      }

      // Prices
      const bodyText=doc.body?.textContent||'';
      const priceMatches=[...new Set([...bodyText.matchAll(/€\s*\d[\d.,]*/g)].map(m=>m[0]))].slice(0,6);
      if(priceMatches.length&&!prices.length) prices=priceMatches;

      // Contact
      const telLink=html.match(/href="tel:([^"]+)"/i)?.[1];
      if(telLink) phone=telLink.replace(/\s/g,'');
      else{
        const phoneMatch=bodyText.match(/(?:\+39|0039)[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);
        if(phoneMatch) phone=phoneMatch[0].trim();
      }
      const mailLink=html.match(/href="mailto:([^"]+)"/i)?.[1];
      if(mailLink) email=mailLink.split('?')[0];
      else{
        const emailMatch=html.match(/([\w.+-]+@[\w-]+\.(?:it|com|eu|net|org))/i);
        if(emailMatch) email=emailMatch[1];
      }
      const addrEl=doc.querySelector('[itemprop="streetAddress"],[class*="address"],[itemprop="address"],[class*="location"],[class*="indirizzo"]');
      if(addrEl) address=addrEl.textContent.trim().replace(/\s+/g,' ').slice(0,120);

      /* ── Map / Geo extraction ── */
      // 1. Google Maps iframe — extract the q= parameter
      const gmapIframe=doc.querySelector('iframe[src*="google.com/maps"],iframe[src*="maps.google"]');
      if(gmapIframe){
        const iSrc=gmapIframe.getAttribute('src')||'';
        const qMatch=iSrc.match(/[?&]q=([^&]+)/);
        if(qMatch) mapQuery=decodeURIComponent(qMatch[1]).replace(/\+/g,' ');
        else{
          const pbMatch=iSrc.match(/!2d([-\d.]+)!3d([-\d.]+)/);
          if(pbMatch) mapQuery=pbMatch[2]+','+pbMatch[1]; // lat,lng
        }
      }
      // 2. Schema.org GeoCoordinates
      if(!mapQuery){
        const geoLat=doc.querySelector('[itemprop="latitude"]');
        const geoLng=doc.querySelector('[itemprop="longitude"]');
        if(geoLat&&geoLng) mapQuery=geoLat.getAttribute('content')+','+geoLng.getAttribute('content');
      }
      // 3. JSON-LD geo
      if(!mapQuery){
        const geoMatch=html.match(/"latitude"\s*:\s*"?([-\d.]+)"?\s*,\s*"longitude"\s*:\s*"?([-\d.]+)"?/i);
        if(geoMatch) mapQuery=geoMatch[1]+','+geoMatch[2];
      }
      // 4. data-lat/data-lng attributes
      if(!mapQuery){
        const geoEl=doc.querySelector('[data-lat][data-lng],[data-latitude][data-longitude]');
        if(geoEl){
          const lat=geoEl.getAttribute('data-lat')||geoEl.getAttribute('data-latitude');
          const lng=geoEl.getAttribute('data-lng')||geoEl.getAttribute('data-longitude');
          if(lat&&lng) mapQuery=lat+','+lng;
        }
      }
      // 5. OpenStreetMap / Leaflet center
      if(!mapQuery){
        const osmMatch=html.match(/setView\(\s*\[\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\]/);
        if(osmMatch) mapQuery=osmMatch[1]+','+osmMatch[2];
      }
      // 6. Fallback: use extracted address or hotel name
      if(!mapQuery&&address) mapQuery=address;
      if(!mapQuery&&hotelName) mapQuery=hotelName+' hotel';

      // Rooms — find room headings
      if(!rooms.length){
        doc.querySelectorAll('h2,h3,h4').forEach(h=>{
          const t=h.textContent.trim();
          if(/camera|room|suite|superior|deluxe|classic|standard|family|junior|panoram|comfort|economy|singol|doubl|triple|matrimonial/i.test(t)&&t.length>3&&t.length<80){
            rooms.push(t);
          }
        });
        rooms=rooms.slice(0,8);
      }

      // Stars
      if(!stars){
        const starsSchema=html.match(/"starRating"[^}]*"ratingValue"\s*:\s*"?(\d)"?/i)?.[1]
          ||html.match(/"ratingValue"\s*:\s*"?([3-5])"?/i)?.[1];
        if(starsSchema) stars=parseInt(starsSchema);
        else if(/5\s*stell|five.star|★★★★★/i.test(bodyText)) stars=5;
        else if(/4\s*stell|four.star|★★★★/i.test(bodyText)) stars=4;
        else if(/3\s*stell|three.star|★★★/i.test(bodyText)) stars=3;
      }
    }

    /* ── LAYER 4: Manual fallback if nothing worked ── */
    if((!hotelName||hotelName.length<4)&&!html&&!scraperOK){
      btn.innerHTML=origHTML;
      btn.style.pointerEvents='auto';
      const results=document.getElementById('makeover-results');
      results.style.display='block';
      results.innerHTML=`
        <div style="text-align:center;padding:40px 24px;max-width:480px;margin:0 auto">
          <div style="font-size:40px;margin-bottom:16px">🏨</div>
          <h3 style="font-family:var(--serif);font-size:22px;margin-bottom:8px">${t('manualTitle')}</h3>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:28px;line-height:1.6">
            ${t('manualDesc')}
          </p>
          <div style="text-align:left">
            <label style="font-size:11px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;font-weight:600;display:block;margin-bottom:6px">${t('manualLabel')}</label>
            <input type="text" id="manualHotelName" placeholder="${t('manualPlaceholder')}" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid rgba(0,0,0,.10);background:#fff;color:var(--text-primary);font-size:16px;font-family:var(--sans);margin-bottom:16px">
            <label style="font-size:11px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;font-weight:600;display:block;margin-bottom:6px">${t('manualClassLabel')}</label>
            <div style="display:flex;gap:8px;margin-bottom:24px">
              <button onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--gold)';document.getElementById('manualStars').value='3'" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:#fff;color:var(--text-secondary);font-size:13px;cursor:pointer">★★★</button>
              <button onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--gold)';document.getElementById('manualStars').value='4'" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:#fff;color:var(--text-secondary);font-size:13px;cursor:pointer">★★★★</button>
              <button onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--gold)';document.getElementById('manualStars').value='5'" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:#fff;color:var(--text-secondary);font-size:13px;cursor:pointer">★★★★★</button>
            </div>
            <input type="hidden" id="manualStars" value="4">
          </div>
          <button onclick="generateManual()" class="btn-generate" style="width:100%;font-size:16px;padding:16px;border-radius:12px;border:none;cursor:pointer">
            ${t('manualGenerate')}
          </button>
        </div>`;
      results.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }

    /* ── Detect star rating from any text we have ── */
    if(!stars){
      const allText=(hotelName+' '+metaDesc).toLowerCase();
      if(/5\s*stell|5.star|five.star|lusso|luxury/i.test(allText)) stars=5;
      else if(/4\s*stell|4.star|four.star|superior/i.test(allText)) stars=4;
      else if(/3\s*stell|3.star|three.star/i.test(allText)) stars=3;
    }

    /* ── Fill missing data with smart defaults ── */
    if(!hotelName) hotelName=t('defaultHotelName');
    if(!prices.length) prices=['Da €89/notte'];

    /* If no logo found, use high-res Google favicon as fallback */
    if(!logo&&domain) logo='https://www.google.com/s2/favicons?domain='+domain+'&sz=128';

    /* Smart image filling — use Unsplash with hotel-relevant keywords */
    if(images.length<3){
      btn.innerHTML=spin+t('scrImages');
      const nameLC=(hotelName+' '+metaDesc).toLowerCase();
      let imgCategory=FALLBACK_IMGS;
      if(/lake|lago/i.test(nameLC)){
        imgCategory=['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800','https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800','https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'];
      }else if(/sea|mare|beach|spiaggia|coast/i.test(nameLC)){
        imgCategory=['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800','https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800','https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800','https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'];
      }else if(/mountain|montagn|alp|dolom/i.test(nameLC)){
        imgCategory=['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800','https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800','https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800','https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'];
      }
      while(images.length<12) images.push(imgCategory[images.length%imgCategory.length]);
    }else{
      while(images.length<12) images.push(FALLBACK_IMGS[images.length%FALLBACK_IMGS.length]);
    }
    /* Remove tiny favicons if we have real images */
    if(images.length>3) images=images.filter(img=>!img.includes('google.com/s2/favicons'));
    while(images.length<12) images.push(FALLBACK_IMGS[images.length%FALLBACK_IMGS.length]);

    /* Track how many images are real (scraped) vs placeholder */
    const realImageCount=images.filter(img=>!img.includes('unsplash.com')).length;
    /* Final mapQuery fallback — ensure we always have something for the map */
    if(!mapQuery&&address) mapQuery=address;
    if(!mapQuery&&hotelName) mapQuery=hotelName+' hotel';

    hotelData={name:hotelName,desc:metaDesc,headline,images,brandColor,prices,phone,email,address,mapQuery,stars,url,logo,rooms,realImageCount,aboutText,services,highlights,experiences,reviews,tagline,socialLinks,bookingUrl,scraperBotBlocked};

    /* ── Generate Express tier only — others built lazily on tab click ── */
    tierHTML[0]=buildExpress(hotelData);
    tierHTML[1]='';
    tierHTML[2]='';

    /* ── Show results ── */
    document.getElementById('mk-title').textContent=hotelName;
    document.getElementById('mk-url-bar').textContent=url.replace(/^https?:\/\//,'');
    document.getElementById('makeover-results').style.display='block';
    showTier(0);

    /* ── Fire diagnostics in parallel (non-blocking) ── */
    runSiteDiagnostics(url);
    setupDiagObserver();

    setTimeout(()=>document.getElementById('makeover-results').scrollIntoView({behavior:'smooth',block:'start'}),200);

  }catch(err){
    console.error('[Verissa] FATAL ERROR:',err);
    const results=document.getElementById('makeover-results');
    if(results){
      results.style.display='block';
      results.innerHTML=`
        <div style="text-align:center;padding:60px 24px">
          <div style="font-size:48px;margin-bottom:16px">⚠️</div>
          <h3 style="font-family:var(--serif);font-size:22px;margin-bottom:12px">Errore Imprevisto</h3>
          <p style="color:var(--text-secondary);font-size:15px;line-height:1.7;max-width:500px;margin:0 auto 24px">
            ${err.message}
          </p>
          <button onclick="handleGenerate()" class="btn-generate" style="font-size:14px;padding:14px 32px;border-radius:12px;border:none;cursor:pointer">
            🔄 Riprova
          </button>
        </div>`;
      results.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }finally{
    btn.innerHTML=origHTML;
    btn.style.pointerEvents='auto';
  }
}

/* ══════ MANUAL GENERATE (Layer 3 fallback) ══════ */
function generateManual(){
  const name=document.getElementById('manualHotelName')?.value?.trim();
  if(!name){document.getElementById('manualHotelName').focus();return}
  const stars=parseInt(document.getElementById('manualStars')?.value)||4;
  const url=document.getElementById('urlInput').value.trim();
  const FALLBACK_IMGS=[
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
    'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'
  ];

  hotelData={
    name:name,
    desc:'Benvenuti al '+name+' — il vostro angolo di paradiso.',
    headline:'',
    images:FALLBACK_IMGS,
    brandColor:'#1a1a2e',
    prices:['Da €89/notte'],
    phone:'',email:'',address:'',mapQuery:name+' hotel Italia',stars:stars,
    url:url.startsWith('http')?url:'https://'+url,
    logo:'',rooms:[],realImageCount:0,
    aboutText:'',services:[],highlights:[],experiences:[],reviews:[],tagline:'',socialLinks:[],bookingUrl:''
  };

  tierHTML[0]=buildExpress(hotelData);
  tierHTML[1]='';
  tierHTML[2]='';

  document.getElementById('mk-title').textContent=name;
  document.getElementById('mk-url-bar').textContent=url.replace(/^https?:\/\//,'');
  document.getElementById('makeover-results').style.display='block';
  showTier(0);

  /* ── Fire diagnostics in parallel (non-blocking) ── */
  if(url){
    const diagUrl=url.startsWith('http')?url:'https://'+url;
    runSiteDiagnostics(diagUrl);
    setupDiagObserver();
  }

  setTimeout(()=>document.getElementById('makeover-results').scrollIntoView({behavior:'smooth',block:'start'}),200);
}

/* ══════ TIER SWITCHER ══════ */
function showTier(idx){
  document.querySelectorAll('.mk-tab').forEach((t,i)=>t.classList.toggle('active',i===idx));
  /* Lazy-build tier HTML on first access */
  if(!tierHTML[idx]&&hotelData){
    const builders=[buildExpress,buildStandard,buildPremium];
    tierHTML[idx]=builders[idx](hotelData);
  }
  const iframe=document.getElementById('mk-iframe');
  iframe.style.opacity='0';
  setTimeout(()=>{
    iframe.srcdoc=tierHTML[idx];
    iframe.onload=()=>{iframe.style.opacity='1'};
  },150);
}


// Scroll reveal
const observer=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}});
},{threshold:.15});
document.querySelectorAll('.animate-in,.price-card').forEach(el=>observer.observe(el));

/* ══════ PAYMENT MODAL ══════ */
const TIERS=[
  {name:'Express Makeover',price:'399',color:'var(--express)',
   get msg(){return t('tierExpressMsg')},
   get note(){return t('tierExpressNote')}},
  {name:'Direct Booking',price:'599',color:'var(--standard)',
   get msg(){return t('tierStandardMsg')},
   get note(){return t('tierStandardNote')}},
  {name:'Luxury Experience',price:'1.699',color:'var(--premium)',
   get msg(){return t('tierPremiumMsg')},
   get note(){return t('tierPremiumNote')}}
];

const OPT_TIERS=[
  {name:'Tune-Up',price:'199',color:'#34d399',
   get period(){return t('optTunePeriod')},
   get msg(){return t('optTuneMsg')},
   get note(){return t('optTuneNote')},
   get features(){return t('optTuneFeats').split('|')}},
  {name:'Performance',price:'49',color:'#60a5fa',
   get period(){return t('optPerfPeriod')},
   get msg(){return t('optPerfMsg')},
   get note(){return t('optPerfNote')},
   get features(){return t('optPerfFeats').split('|')}},
  {name:'Growth',price:'99',color:'#7e57ff',
   get period(){return t('optGrowthPeriod')},
   get msg(){return t('optGrowthMsg')},
   get note(){return t('optGrowthNote')},
   get features(){return t('optGrowthFeats').split('|')}}
];

/* Stripe Payment Links */
const STRIPE_LINKS={
  'Express Makeover':'https://buy.stripe.com/dRm8wOeSZb9v3PZ2Sh5Rm03',
  'Direct Booking':'https://buy.stripe.com/4gMeVc3ahb9v0DN0K95Rm04',
  'Luxury Experience':'https://buy.stripe.com/dRm3cu9yF5Pb2LV9gF5Rm05'
};
const OPT_STRIPE_LINKS={
  'Tune-Up':'https://buy.stripe.com/28E5kC8uB2CZcmv9gF5Rm06',
  'Performance':'https://buy.stripe.com/3cI00ih1791naenakJ5Rm07',
  'Growth':'https://buy.stripe.com/28E00iaCJ6Tfbir64t5Rm08'
};
let currentTierIdx=0;
let currentOptIdx=-1; /* -1 = not an opt tier */

function openPayment(idx){
  currentTierIdx=idx;
  currentOptIdx=-1;
  const tier=TIERS[idx];
  const overlay=document.getElementById('payOverlay');
  document.getElementById('payBadge').textContent=tier.name;
  document.getElementById('payBadge').style.setProperty('--tier-c',tier.color);
  document.getElementById('payPrice').innerHTML=`<span class="pay-eur">€</span>${tier.price}`;
  document.getElementById('payMsg').innerHTML=tier.msg;
  document.getElementById('payNote').textContent=tier.note;
  document.getElementById('paySubmit').style.background=tier.color;
  document.getElementById('paySubmit').style.color='#fff';
  document.getElementById('payCard').style.setProperty('--tier-c',tier.color);
  document.getElementById('payTierInput').value=tier.name;
  document.getElementById('payStripeBtnPrice').textContent=tier.price;
  /* Reset form section */
  document.getElementById('payFormSection').classList.remove('show');
  // auto-fill hotel name if scraped
  if(hotelData&&hotelData.name){document.getElementById('payHotel').value=hotelData.name}
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
}
function openOptPayment(idx){
  currentOptIdx=idx;
  const o=OPT_TIERS[idx];
  const overlay=document.getElementById('payOverlay');
  document.getElementById('payBadge').textContent=o.name;
  document.getElementById('payBadge').style.setProperty('--tier-c',o.color);
  document.getElementById('payPrice').innerHTML=`<span class="pay-eur">€</span>${o.price}<small style="font-size:18px;font-weight:400;opacity:.6">${o.period}</small>`;
  document.getElementById('payMsg').innerHTML=o.msg;
  document.getElementById('payNote').textContent=o.note;
  document.getElementById('paySubmit').style.background=o.color;
  document.getElementById('paySubmit').style.color='#fff';
  document.getElementById('payCard').style.setProperty('--tier-c',o.color);
  document.getElementById('payTierInput').value=o.name;
  document.getElementById('payStripeBtnPrice').textContent=o.price+(o.period||'');
  document.getElementById('payFormSection').classList.remove('show');
  if(hotelData&&hotelData.name){document.getElementById('payHotel').value=hotelData.name}
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
}
function stripeCheckout(){
  let link;
  if(currentOptIdx>=0){
    const o=OPT_TIERS[currentOptIdx];
    link=OPT_STRIPE_LINKS[o.name];
  } else {
    const tier=TIERS[currentTierIdx];
    link=STRIPE_LINKS[tier.name];
  }
  if(!link){
    alert(currentLang==='it'
      ? 'Il pagamento online sarà attivo a breve. Per ora contattaci via WhatsApp o email per procedere.'
      : 'Online payment coming soon. Contact us via WhatsApp or email to proceed.');
    return;
  }
  const params=new URLSearchParams();
  if(hotelData&&hotelData.name) params.set('client_reference_id',hotelData.name.replace(/\s+/g,'_'));
  const url=link+(params.toString()?'?'+params.toString():'');
  window.open(url,'_blank');
}
function closePayment(){
  document.getElementById('payOverlay').classList.remove('open');
  document.body.style.overflow='';
}
function submitPayment(e){
  e.preventDefault();
  const fd=new FormData(e.target);
  const data=Object.fromEntries(fd.entries());
  // Sanitize user input before rendering
  var sName=esc(data.name||''), sEmail=esc(data.email||''), sTier=esc(data.tier||'');
  // For now — show confirmation. In production, integrate Stripe/PayPal.
  const card=document.getElementById('payCard');
  card.innerHTML=`
    <div style="text-align:center;padding:40px 20px">
      <div style="font-size:48px;margin-bottom:16px">✅</div>
      <h3 style="font-family:var(--serif);font-size:24px;margin-bottom:12px;color:var(--text-primary)">Richiesta Ricevuta!</h3>
      <p style="color:var(--text-secondary);font-size:15px;line-height:1.6;margin-bottom:8px">
        Grazie <strong style="color:var(--text-primary)">${sName}</strong>! Abbiamo ricevuto la tua richiesta per il pacchetto <strong style="color:var(--tier-c)">${sTier}</strong>.
      </p>
      <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin-bottom:24px">
        Ti contatteremo a <strong style="color:var(--text-primary)">${sEmail}</strong> entro le prossime ore con tutti i dettagli per procedere.
      </p>
      <button onclick="closePayment();location.reload()" style="padding:14px 32px;border-radius:12px;border:1.5px solid rgba(0,0,0,.10);background:transparent;color:var(--text-secondary);font-size:14px;cursor:pointer;font-family:var(--sans)">Chiudi</button>
    </div>`;
}

/* ══════ VERISSA CONCIERGE — AI Sales Assistant ══════ */
const CHAT_API='https://verissa-chat-api.vercel.app/api/chat';

// Conversation history for API (role: user/assistant)
let chatMessages=[];
let chatBusy=false;

// ── Greeting bubble auto-show ──
setTimeout(()=>{
  const g=document.getElementById('verissaGreeting');
  if(g && !document.getElementById('chatOverlay').classList.contains('open')) g.classList.add('show');
},3000);

function openChatbot(){
  const g=document.getElementById('verissaGreeting');
  if(g) g.classList.remove('show');
  const ov=document.getElementById('chatOverlay');
  ov.classList.add('open');
  document.body.style.overflow='hidden';
  if(chatMessages.length===0){
    // Initial welcome — no API call needed, instant
    const welcome=currentLang==='en'
      ?'Hello! 👋 I\'m the Verissa Concierge. I can help you find the perfect website solution for your hotel or property. What are you looking for?'
      :'Benvenuto! 👋 Sono il Concierge Verissa. Posso aiutarti a trovare la soluzione perfetta per il sito web della tua struttura ricettiva. Di cosa hai bisogno?';
    appendBotBubble(welcome);
    chatMessages.push({role:'assistant',content:welcome});
    showQuickReplies(currentLang==='en'
      ?['I need a new website','I have a website already','Show me pricing']
      :['Voglio un nuovo sito','Ho già un sito','Mostra i prezzi']);
  }
}
function closeChatbot(){
  document.getElementById('chatOverlay').classList.remove('open');
  document.body.style.overflow='';
}

/* ── Global Escape key + popstate: release body overflow from any open overlay ── */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    var pay=document.getElementById('payOverlay');
    if(pay&&pay.classList.contains('open')){closePayment();return}
    var chat=document.getElementById('chatOverlay');
    if(chat&&chat.classList.contains('open')){closeChatbot();return}
    /* Close any other overlay that locks body overflow */
    document.body.style.overflow='';
  }
});
window.addEventListener('popstate',function(){
  var pay=document.getElementById('payOverlay');
  if(pay&&pay.classList.contains('open'))closePayment();
  var chat=document.getElementById('chatOverlay');
  if(chat&&chat.classList.contains('open'))closeChatbot();
  document.body.style.overflow='';
});

/* ── UI Helpers ── */
function appendBotBubble(html){
  const box=document.getElementById('chatMessages');
  const div=document.createElement('div');
  div.className='chatbot-msg bot';
  div.innerHTML=html;
  box.appendChild(div);
  box.scrollTop=box.scrollHeight;
}
function appendUserBubble(text){
  const box=document.getElementById('chatMessages');
  const div=document.createElement('div');
  div.className='chatbot-msg user';
  div.textContent=text;
  box.appendChild(div);
  box.scrollTop=box.scrollHeight;
}
function showTyping(){
  const box=document.getElementById('chatMessages');
  const el=document.createElement('div');
  el.className='chatbot-typing';el.id='cbTyping';
  el.innerHTML='<span></span><span></span><span></span>';
  box.appendChild(el);
  box.scrollTop=box.scrollHeight;
}
function hideTyping(){
  const el=document.getElementById('cbTyping');
  if(el) el.remove();
}
function showQuickReplies(options){
  const qr=document.getElementById('chatQR');
  qr.innerHTML='';
  if(!options||!options.length) return;
  options.forEach(txt=>{
    const btn=document.createElement('button');
    btn.textContent=txt;
    btn.onclick=()=>chatSendText(txt);
    qr.appendChild(btn);
  });
}
function clearQuickReplies(){
  document.getElementById('chatQR').innerHTML='';
}

/* ── Parse AI response: extract [QR:...] and [ACTION:...] ── */
function parseAIResponse(text){
  let html=text;
  let qr=[];
  let action=null;

  // Extract quick replies [QR:opt1|opt2|opt3]
  const qrMatch=html.match(/\[QR:([^\]]+)\]/);
  if(qrMatch){
    qr=qrMatch[1].split('|').map(s=>s.trim()).filter(Boolean);
    html=html.replace(qrMatch[0],'').trim();
  }

  // Extract action [ACTION:buy:express] etc
  const actMatch=html.match(/\[ACTION:(\w+):(\w+)\]/);
  if(actMatch){
    action={type:actMatch[1],target:actMatch[2]};
    html=html.replace(actMatch[0],'').trim();
  }

  // Convert markdown-ish formatting to HTML
  html=html.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  html=html.replace(/\n/g,'<br>');

  return {html,qr,action};
}

/* ── Execute action tags from AI ── */
function executeAction(action){
  if(!action) return;
  const map={express:0,standard:1,directbooking:1,premium:2,luxury:2,tuneup:0,performance:1,growth:2};
  const idx=map[action.target];
  if(idx===undefined) return;
  if(action.type==='buy'){
    if(['tuneup','performance','growth'].includes(action.target)){
      setTimeout(()=>{closeChatbot();openOptPayment(idx)},600);
    } else {
      setTimeout(()=>{closeChatbot();openPayment(idx)},600);
    }
  }
}

/* ── Core: send message to AI API (STREAMING) ── */
async function chatRespond(userText){
  if(chatBusy) return;
  chatBusy=true;
  clearQuickReplies();
  showTyping();

  chatMessages.push({role:'user',content:userText});

  try {
    const chatCtrl=new AbortController();
    const chatTO=setTimeout(()=>chatCtrl.abort(),25000);
    const resp=await fetch(CHAT_API,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:chatMessages}),
      signal:chatCtrl.signal
    });
    clearTimeout(chatTO);

    if(!resp.ok) throw new Error('API '+resp.status);

    // Check if streaming (SSE) or fallback JSON
    const ct=resp.headers.get('content-type')||'';
    if(ct.includes('text/event-stream')){
      // ── Streaming mode: show tokens as they arrive ──
      hideTyping();
      const box=document.getElementById('chatMessages');
      const div=document.createElement('div');
      div.className='chatbot-msg bot';
      div.innerHTML='';
      box.appendChild(div);

      let fullText='';
      const reader=resp.body.getReader();
      const decoder=new TextDecoder();
      let sseBuffer='';

      while(true){
        const {done,value}=await reader.read();
        if(done) break;
        sseBuffer+=decoder.decode(value,{stream:true});

        const lines=sseBuffer.split('\n');
        sseBuffer=lines.pop()||'';

        for(const line of lines){
          if(!line.startsWith('data: ')) continue;
          const d=line.slice(6);
          if(d==='[DONE]') continue;
          try{
            const evt=JSON.parse(d);
            if(evt.t){
              fullText+=evt.t;
              // Live-render: convert markdown bold + newlines
              let display=fullText.replace(/\[QR:[^\]]*\]/g,'').replace(/\[ACTION:[^\]]*\]/g,'');
              display=display.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
              div.innerHTML=display;
              box.scrollTop=box.scrollHeight;
            }
          }catch(e){}
        }
      }

      // Finalize: parse full text for QR/ACTION
      chatMessages.push({role:'assistant',content:fullText});
      const parsed=parseAIResponse(fullText);
      div.innerHTML=parsed.html;
      if(parsed.qr.length) showQuickReplies(parsed.qr);
      if(parsed.action) executeAction(parsed.action);

    } else {
      // ── Fallback: non-streaming JSON response ──
      hideTyping();
      const data=await resp.json();
      if(data.fallback) throw new Error('fallback');
      const aiText=data.text||'';
      chatMessages.push({role:'assistant',content:aiText});
      const parsed=parseAIResponse(aiText);
      appendBotBubble(parsed.html);
      if(parsed.qr.length) showQuickReplies(parsed.qr);
      if(parsed.action) executeAction(parsed.action);
    }

  } catch(err){
    hideTyping();
    const fallback=currentLang==='en'
      ?'I\'m having a brief connection issue. In the meantime, you can try our live website generator above — just paste your hotel URL and see the transformation instantly! Or reach us on WhatsApp for immediate help.'
      :'Ho un piccolo problema di connessione. Nel frattempo, puoi provare il nostro generatore qui sopra — incolla il link del tuo sito e guarda la trasformazione! Oppure scrivici su WhatsApp per assistenza immediata.';
    appendBotBubble(fallback);
    chatMessages.push({role:'assistant',content:fallback});
    showQuickReplies(currentLang==='en'
      ?['Try the generator ↑','Contact on WhatsApp']
      :['Prova il generatore ↑','Scrivi su WhatsApp']);
  }

  chatBusy=false;
}

/* ── Send from input field ── */
function chatSend(){
  const input=document.getElementById('chatInput');
  const text=input.value.trim();
  if(!text||chatBusy) return;
  input.value='';
  appendUserBubble(text);
  chatRespond(text);
}

/* ── Send from quick reply button ── */
function chatSendText(text){
  if(chatBusy) return;
  appendUserBubble(text);
  chatRespond(text);
}

/* ══════════════════════════════════════════════════════════
   LIVE SITE DIAGNOSTICS ENGINE
   Calls Google PageSpeed Insights API in parallel with site
   generation. Results populate the panel at the bottom of the
   demo section. IntersectionObserver triggers the slide-up.
   ══════════════════════════════════════════════════════════ */
const SD_API_KEY='AIzaSyAvildEWidKHSwHE3nkT2HUNwsHUEs8i9E';

function sdEsc(s){return String(s||'').replace(/`/g,"'").replace(/</g,'&lt;').replace(/>/g,'&gt;')}

function sdScoreColor(s){
  if(s>=90) return '#00e676';
  if(s>=50) return '#ffab00';
  return '#ff5252';
}

async function runSiteDiagnostics(url){
  const panel=document.getElementById('siteDiagPanel');
  const loading=document.getElementById('sdLoading');
  const results=document.getElementById('sdResults');
  const detail=document.getElementById('sdLoadingDetail');
  if(!panel) return;

  /* Reset state */
  panel.classList.remove('sd-animate');
  panel.classList.add('sd-visible');
  panel.style.display='block';
  loading.style.display='flex';
  results.style.display='none';

  /* Animate in immediately (loading state) */
  requestAnimationFrame(()=>requestAnimationFrame(()=>panel.classList.add('sd-animate')));

  const msgs=[t('sdMsg1'),t('sdMsg2'),t('sdMsg3'),t('sdMsg4')];
  let mi=0;
  const msgTimer=setInterval(()=>{mi++;if(mi<msgs.length)detail.textContent=msgs[mi]},4000);

  try{
    const endpoint=`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=seo&category=best-practices&key=${SD_API_KEY}`;

    const ctrl=new AbortController();
    const to=setTimeout(()=>ctrl.abort(),120000);
    const r=await fetch(endpoint,{signal:ctrl.signal});
    clearTimeout(to);
    clearInterval(msgTimer);

    if(!r.ok){
      const txt=await r.text();
      console.error('[Verissa Diag] API error:',r.status,txt);
      throw new Error('API error '+r.status);
    }

    const data=await r.json();
    const lhr=data.lighthouseResult;
    if(!lhr){throw new Error('No lighthouse data returned')}

    /* Extract scores */
    const cats=lhr.categories||{};
    const perf=Math.round((cats.performance?.score||0)*100);
    const a11y=Math.round((cats.accessibility?.score||0)*100);
    const seo=Math.round((cats['seo']?.score||0)*100);
    const bp=Math.round((cats['best-practices']?.score||0)*100);

    /* Performance ring */
    const ring=document.getElementById('sdScoreRing');
    const num=document.getElementById('sdScoreNum');
    ring.style.setProperty('--sd-ring-color',sdScoreColor(perf));
    ring.style.setProperty('--sd-ring-pct',perf+'%');
    num.style.color=sdScoreColor(perf);
    num.textContent=perf;

    /* SEO ring */
    const seoRing=document.getElementById('sdSeoRing');
    const seoNum=document.getElementById('sdSeoNum');
    seoRing.style.setProperty('--sd-ring-color',sdScoreColor(seo));
    seoRing.style.setProperty('--sd-ring-pct',seo+'%');
    seoNum.style.color=sdScoreColor(seo);
    seoNum.textContent=seo;

    /* Verdict — based on the weaker of perf and seo */
    const worst=Math.min(perf,seo);
    const verdict=document.getElementById('sdVerdict');
    if(worst>=90) verdict.textContent=t('sdVerdictGood');
    else if(worst>=50) verdict.textContent=t('sdVerdictAvg');
    else verdict.textContent=t('sdVerdictBad');

    /* Score bars */
    const grid=document.getElementById('sdGrid');
    const bars=[
      {label:t('sdBarPerf'),score:perf},
      {label:t('sdBarA11y'),score:a11y},
      {label:t('sdBarSEO'),score:seo},
      {label:t('sdBarBP'),score:bp}
    ];
    grid.innerHTML=bars.map(b=>`
      <div class="sd-bar-item">
        <div class="sd-bar-label"><span>${b.label}</span><span style="color:${sdScoreColor(b.score)};font-weight:700">${b.score}</span></div>
        <div class="sd-bar-track"><div class="sd-bar-fill" style="width:0%;background:${sdScoreColor(b.score)}"></div></div>
      </div>
    `).join('');
    /* Animate bars */
    setTimeout(()=>{
      grid.querySelectorAll('.sd-bar-fill').forEach((f,i)=>{f.style.width=bars[i].score+'%'});
    },100);

    /* Core Web Vitals */
    const vitals=document.getElementById('sdVitals');
    const audits=lhr.audits||{};
    const vitalData=[
      {key:'first-contentful-paint',name:t('sdVitalFCP'),unit:'s'},
      {key:'largest-contentful-paint',name:t('sdVitalLCP'),unit:'s'},
      {key:'total-blocking-time',name:t('sdVitalTBT'),unit:'ms'},
      {key:'cumulative-layout-shift',name:t('sdVitalCLS'),unit:''},
      {key:'speed-index',name:t('sdVitalSI'),unit:'s'},
      {key:'interactive',name:t('sdVitalTTI'),unit:'s'}
    ];
    vitals.innerHTML=vitalData.map(v=>{
      const audit=audits[v.key];
      if(!audit) return '';
      const val=audit.displayValue||audit.numericValue||'—';
      const color=sdScoreColor((audit.score||0)*100);
      return `<div class="sd-vital-card"><div class="sd-vital-val" style="color:${color}">${sdEsc(String(val))}</div><div class="sd-vital-name">${v.name}</div></div>`;
    }).join('');

    /* Feature checks */
    const features=document.getElementById('sdFeatures');
    const checks=[
      {key:'is-on-https',label:t('sdCheckHTTPS')},
      {key:'redirects-http',label:t('sdCheckRedirect')},
      {key:'viewport',label:t('sdCheckViewport')},
      {key:'document-title',label:t('sdCheckTitle')},
      {key:'meta-description',label:t('sdCheckMeta')},
      {key:'image-alt',label:t('sdCheckAlt')},
      {key:'link-text',label:t('sdCheckLink')},
      {key:'robots-txt',label:t('sdCheckRobots')},
    ];
    features.innerHTML=checks.map(c=>{
      const a=audits[c.key];
      if(!a) return '';
      const pass=a.score===1;
      return `<div class="sd-feat ${pass?'sd-feat-pass':'sd-feat-fail'}">${pass?'✓':'✗'} ${c.label}</div>`;
    }).join('');

    /* Top weaknesses */
    const weakness=document.getElementById('sdWeakness');
    const itTranslations={
      'Largest Contentful Paint':'Tempo di caricamento principale (LCP)',
      'First Contentful Paint':'Primo contenuto visibile (FCP)',
      'Speed Index':'Indice di velocità',
      'Total Blocking Time':'Tempo di blocco totale (TBT)',
      'Cumulative Layout Shift':'Stabilità visiva della pagina (CLS)',
      'Time to Interactive':'Tempo di interattività (TTI)',
      'Max Potential First Input Delay':'Ritardo massimo al primo input',
      'First Meaningful Paint':'Primo rendering significativo',
      'Reduce unused JavaScript':'Rimuovi JavaScript inutilizzato',
      'Reduce unused CSS':'Rimuovi CSS inutilizzato',
      'Eliminate render-blocking resources':'Elimina risorse che bloccano il rendering',
      'Properly size images':'Dimensiona correttamente le immagini',
      'Defer offscreen images':'Caricamento differito delle immagini',
      'Efficiently encode images':'Ottimizza la compressione delle immagini',
      'Serve images in next-gen formats':'Usa formati immagine moderni (WebP/AVIF)',
      'Enable text compression':'Abilita la compressione del testo',
      'Minify CSS':'Minimizza il CSS',
      'Minify JavaScript':'Minimizza il JavaScript',
      'Reduce initial server response time':'Riduci il tempo di risposta del server',
      'Avoid multiple page redirects':'Evita reindirizzamenti multipli',
      'Preload Largest Contentful Paint image':'Precarica l\'immagine principale',
      'Avoid enormous network payloads':'Riduci il peso delle risorse di rete',
      'Avoid an excessive DOM size':'Riduci la complessità del DOM',
      'Reduce JavaScript execution time':'Riduci il tempo di esecuzione JavaScript',
      'Minimize main-thread work':'Minimizza il lavoro sul thread principale',
      'Ensure text remains visible during webfont load':'Mantieni il testo visibile durante il caricamento dei font',
      'Image elements do not have explicit width and height':'Le immagini non hanno dimensioni esplicite',
      'Avoid serving legacy JavaScript to modern browsers':'Evita JavaScript legacy per browser moderni'
    };
    function sdTranslate(title){return currentLang==='en'?title:(itTranslations[title]||title)}
    const opps=(lhr.categories?.performance?.auditRefs||[])
      .filter(r=>r.weight>0&&r.group==='metrics'||r.group==='load-opportunities')
      .map(r=>audits[r.id])
      .filter(a=>a&&a.score!==null&&a.score<0.9)
      .sort((a,b)=>(a.score||0)-(b.score||0))
      .slice(0,5);

    if(opps.length){
      weakness.innerHTML=`<h4>${t('sdWeaknessTitle')}</h4><ul>${opps.map(o=>`<li>${sdEsc(sdTranslate(o.title))}</li>`).join('')}</ul>`;
    } else {
      weakness.style.display='none';
    }

    /* Show results, hide loading */
    loading.style.display='none';
    results.style.display='block';

  } catch(err){
    clearInterval(msgTimer);
    console.error('[Verissa Diag] Error:',err);
    loading.style.display='none';
    results.style.display='none';
    /* Show inline error */
    const inner=document.getElementById('siteDiagInner');
    const existing=inner.querySelector('.sd-error');
    if(existing) existing.remove();
    const errDiv=document.createElement('div');
    errDiv.className='sd-error';
    errDiv.innerHTML=`<div class="sd-error-icon">⚠️</div><div class="sd-error-msg">${t('sdAnalyzeError')}<br><small style="color:var(--text-muted)">${sdEsc(err.message)}</small></div>`;
    inner.appendChild(errDiv);
  }
}

/* ── IntersectionObserver: trigger diagnostics slide-up when user scrolls past mid-iframe ── */
let sdObserverSetup=false;
function setupDiagObserver(){
  if(sdObserverSetup) return;
  sdObserverSetup=true;
  const panel=document.getElementById('siteDiagPanel');
  if(!panel) return;
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        if(panel.classList.contains('sd-visible')&&!panel.classList.contains('sd-animate')){
          panel.classList.add('sd-animate');
        }
      }
    });
  },{threshold:0.3});
  obs.observe(panel);
}

