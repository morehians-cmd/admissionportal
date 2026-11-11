/*****************************************************************************
 MOREH ACADEMY PORTAL - PUBLIC (add as a NEW file named "Public")
 Server side of PublicHome.html. These functions need NO sign-in, so they return
 only what is safe for anyone on the internet: school year, portal link, the
 enrollment guide text, next 3 events, 5 campus photos, vision / mission / values /
 history. Never students, staff, leaders' contact details or holds.

 Requires the existing: ok, fail, activeSY_, blockRow_ (Content), cleanPolicy_ (Hardening),
 galRead_ (Gallery), photo_, evRows_, aboutRead_ (Content).
 This file already contains getPublicAbout, so do NOT also paste Public-addition.gs.
*****************************************************************************/
const PUB_GALLERY_PAGE = 'facilities', PUB_GALLERY_MAX = 5, PUB_EVENTS_MAX = 3;

/** Internal: expire today's cached public homepage feed after relevant content changes. */
function invalidatePublicContentCache_() {
  try {
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    CacheService.getScriptCache().remove('pubc_v1_' + today);
  } catch (_) {}
}

/** PUBLIC. Everything the homepage needs in one call (cached 5 minutes). */
function getPublicContent() {
  try {
    const cache = CacheService.getScriptCache(), tz = Session.getScriptTimeZone();
    const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'), ck = 'pubc_v1_' + today;
    const hit = cache.get(ck); if (hit) return JSON.parse(hit);

    const gb = blockRow_('guide');
    const guide = gb.row ? cleanPolicy_(String(gb.sh.getRange(gb.row, 2).getValue() || '')) : '';

    const posts = evRows_();
    const announcements = posts
      .filter(e => e.Category === 'Announcement' && e.EventDate >= today)
      .sort((a, b) => b.EventDate.localeCompare(a.EventDate))
      .slice(0, 5)
      .map(e => ({ t:e.Title, d:e.EventDate, v:e.Venue, x:e.Details, category:e.Category }));
    const events = posts
      .filter(e => e.Category !== 'Announcement' && e.EventDate >= today)
      .sort((a, b) => (a.EventDate + a.EventTime).localeCompare(b.EventDate + b.EventTime))
      .slice(0, PUB_EVENTS_MAX)
      .map(e => ({ t:e.Title, d:e.EventDate, tm:e.EventTime, v:e.Venue, x:e.Details, category:e.Category }));

    const gallery = galRead_(PUB_GALLERY_PAGE).list.slice(0, PUB_GALLERY_MAX).map(p => ({ id: p.id, cap: p.cap }));

    const out = ok({ sy: activeSY_(), portal: ScriptApp.getService().getUrl() + '?page=portal', guide: guide, announcements:announcements, events:events, gallery:gallery });
    try { cache.put(ck, JSON.stringify(out), 300); } catch (_) {}
    return out;
  } catch (e) { return fail(e); }
}

/** PUBLIC. One campus photo as a data URI. Serves ONLY photos shown on the homepage, so it cannot read other Drive files. */
function getPublicPhoto(id) {
  try {
    id = String(id || '');
    if (!galRead_(PUB_GALLERY_PAGE).list.slice(0, PUB_GALLERY_MAX).some(x => x.id === id)) throw new Error('Photo not found.');
    const cache = CacheService.getScriptCache(), k = 'pubp_' + id, hit = cache.get(k);
    if (hit) return ok(hit);
    const uri = photo_(id);
    if (uri && uri.length < 95000) { try { cache.put(k, uri, 21600); } catch (_) {} }   // cache entries are limited to 100 KB
    return ok(uri);
  } catch (e) { return fail(e); }
}

/** PUBLIC. Vision, mission, core values and history. Leaders (names, emails, phones, photos) are NOT returned. */
function getPublicAbout() {
  try {
    const cache = CacheService.getScriptCache(), hit = cache.get('puba_v1');
    if (hit) return JSON.parse(hit);
    const a = aboutRead_();
    const out = ok({ vision: a.vision, mission: a.mission, values: a.values, timeline: a.timeline, leaders: a.leaders.map(l => ({ name:l.name, title:l.title, photo:l.photo })) });
    try { cache.put('puba_v1', JSON.stringify(out), 600); } catch (_) {}
    return out;
  } catch (e) { return fail(e); }
}

/** PUBLIC. URL of the public homepage (used by the sign-in page's "Back to homepage" link). */
function getHomeUrl() { return ScriptApp.getService().getUrl(); }

/** PUBLIC. Returns only approved, sanitized public-page HTML blocks. */
const PUBLIC_BLOCK_KEYS = ['pubhome','pubabout','pubadmissions','pubacademics','pubcampus','pubforms','pubnews','pubcontact','pub_about_values','pub_about_history','pub_about_leadership','pub_adm_enrollment','pub_adm_requirements','pub_adm_scholarships','pub_adm_faq','pub_acad_kindergarten','pub_acad_elementary','pub_acad_junior_high','pub_acad_senior_high','pub_acad_college','pub_campus_organizations','pub_campus_events','pub_campus_sports','pub_campus_clubs','pub_campus_facilities','pub_forms_tlc','pub_forms_consent','pub_news_announcements','pub_news_latest','pub_news_events','pub_news_enrollment','pub_news_achievements'];
function getPublicBlock(key) {
  try {
    key = String(key || '');
    if (!PUBLIC_BLOCK_KEYS.includes(key)) throw new Error('Unknown public page.');
    const b = blockRow_(key);
    const saved = b.row ? String(b.sh.getRange(b.row, 2).getValue() || '') : '';
    let html = saved ? cleanPolicy_(saved) : '';
    // Admin's initial editor placeholders contain headings and generic "to be added" text.
    // Do not let those placeholders replace the complete public-page template.
    const hasRealContent = /<(p|li|details|summary|blockquote)\b/i.test(html) &&
      !/Content to be added by the Administrator/i.test(html);
    if (!hasRealContent) html = '';
    return ok({ html: html });
  } catch (e) { return fail(e); }
}


/** PUBLIC. Read only the approved facilities gallery and its captions. */
function getPublicFacilities() {
  try {
    const list = galRead_('facilities').list.map(p => ({ id:p.id, cap:p.cap }));
    return ok({ items:list });
  } catch (e) { return fail(e); }
}
/** PUBLIC. Serves only an image already listed in the Facilities & Campus Tour gallery. */
function getPublicFacilityPhoto(id) {
  try {
    id = String(id || '');
    if (!galRead_('facilities').list.some(x => x.id === id)) throw new Error('Photo not found.');
    const cache = CacheService.getScriptCache(), key = 'pubfacility_' + id, hit = cache.get(key);
    if (hit) return ok(hit);
    const uri = photo_(id);
    if (uri && uri.length < 95000) { try { cache.put(key, uri, 21600); } catch (_) {} }
    return ok(uri);
  } catch (e) { return fail(e); }
}
/** PUBLIC. Serves only the one approved photo assigned to a public subsection page. */
function getPublicPagePhoto(page) {
  try {
    page = String(page || '');
    const allowed = ["about-values","about-history","about-leadership","admissions-enrollment","admissions-requirements","admissions-scholarships","admissions-faq","academics-kindergarten","academics-elementary","academics-junior-high","academics-senior-high","academics-college","campus-organizations","campus-events","campus-sports","campus-clubs","campus-facilities","forms-tlc-application","forms-consent","news-announcements","news-latest","news-events","news-enrollment","news-achievements"];
    if (!allowed.includes(page)) throw new Error('Unknown public page.');
    const item = galRead_(page).list[0];
    if (!item) return ok({ photo:'' });
    const cache = CacheService.getScriptCache(), key = 'pubpagephoto_' + page + '_' + item.id, hit = cache.get(key);
    if (hit) return ok({ photo:hit });
    const uri = photo_(item.id);
    if (uri && uri.length < 95000) { try { cache.put(key, uri, 21600); } catch (_) {} }
    return ok({ photo:uri || '' });
  } catch (e) { return fail(e); }
}

/** PUBLIC. Serves only a current School Leadership photo, never private contact details. */
function getPublicLeaderPhoto(id) {
  try {
    id = String(id || '');
    if (!aboutRead_().leaders.some(x => x.photo === id)) throw new Error('Photo not found.');
    const cache = CacheService.getScriptCache(), key = 'publeader_' + id, hit = cache.get(key);
    if (hit) return ok(hit);
    const uri = photo_(id);
    if (uri && uri.length < 95000) { try { cache.put(key, uri, 21600); } catch (_) {} }
    return ok(uri);
  } catch (e) { return fail(e); }
}


/** PUBLIC. Approved historical photo highlights for the About Us page. */
function getPublicHistoryGallery() {
  try { return ok({ items:galRead_('history').list }); }
  catch (e) { return fail(e); }
}
function getPublicHistoryPhoto(id) {
  try {
    id = String(id || '');
    if (!galRead_('history').list.some(x => x.id === id)) throw new Error('Photo not found.');
    const cache = CacheService.getScriptCache(), key = 'pubhistory_' + id, hit = cache.get(key);
    if (hit) return ok(hit);
    const uri = photo_(id);
    if (uri && uri.length < 95000) { try { cache.put(key, uri, 21600); } catch (_) {} }
    return ok(uri);
  } catch (e) { return fail(e); }
}

/* ---------- Editable public homepage hero settings ---------- */
const PUBLIC_HERO_KEY_ = 'pubhome_hero';
const PUBLIC_HERO_DEFAULTS_ = {
  headline:'Welcome to Moreh Academy',
  subheadline:'School of Righteousness and Excellence.',
  description:'Welcome to Moreh Academy. School of Righteousness and Excellence.',
  primaryText:'Enroll Now!',
  primaryUrl:'?page=create-account',
  secondaryText:'Discover Moreh Academy',
  secondaryUrl:'?page=about',
  images:[
    'https://drive.google.com/thumbnail?id=138oALvviA236UvUnJZR62TVqask4gmWQ&sz=w2000',
    'https://drive.google.com/thumbnail?id=1GodLs1Umo_qPFwt7PRJIYenfsUsNeJkD&sz=w2000',
    'https://drive.google.com/thumbnail?id=1iW7wmwTgy38RS7g7cccbA-hCBCcd38Xf&sz=w2000'
  ]
};
function publicHeroImage_(value, fallback) {
  const s=String(value||'').trim();
  if (!s) return fallback;
  if (/^https:\/\/drive\.google\.com\/thumbnail\?id=[A-Za-z0-9_-]+(?:&[^"'<> ]*)?$/i.test(s)) return s.slice(0,1000);
  if (/^https:\/\/lh3\.googleusercontent\.com\/[A-Za-z0-9_./?=&%-]+$/i.test(s)) return s.slice(0,1000);
  throw new Error('Hero images must use a Google Drive thumbnail or Google-hosted image URL.');
}
function publicHeroClean_(input) {
  input=input&&typeof input==='object'?input:{};
  const clean=(key,max,fallback)=>String(input[key]==null?fallback:input[key]).replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max);
  const url=(key,fallback)=>{
    const s=String(input[key]==null?fallback:input[key]).trim().slice(0,1000);
    if (/^https:\/\//i.test(s) || /^\?page=[A-Za-z0-9_-]+$/.test(s) || /^\/[A-Za-z0-9/_-]*$/.test(s)) return s;
    throw new Error('Use a secure https link or an internal ?page= link for homepage buttons.');
  };
  const imgs=Array.isArray(input.images)?input.images:[];
  return {
    headline:clean('headline',100,PUBLIC_HERO_DEFAULTS_.headline),
    subheadline:clean('subheadline',140,PUBLIC_HERO_DEFAULTS_.subheadline),
    description:clean('description',280,PUBLIC_HERO_DEFAULTS_.description),
    primaryText:clean('primaryText',40,PUBLIC_HERO_DEFAULTS_.primaryText),
    primaryUrl:url('primaryUrl',PUBLIC_HERO_DEFAULTS_.primaryUrl),
    secondaryText:clean('secondaryText',50,PUBLIC_HERO_DEFAULTS_.secondaryText),
    secondaryUrl:url('secondaryUrl',PUBLIC_HERO_DEFAULTS_.secondaryUrl),
    images:[0,1,2].map(i=>publicHeroImage_(imgs[i],PUBLIC_HERO_DEFAULTS_.images[i]))
  };
}
/** PUBLIC. Only non-sensitive public homepage presentation settings are returned. */
function getHomepageHero() {
  try {
    const b=blockRow_(PUBLIC_HERO_KEY_);
    if (!b.row) return ok(PUBLIC_HERO_DEFAULTS_);
    const raw=String(b.sh.getRange(b.row,2).getValue()||'');
    if (!raw) return ok(PUBLIC_HERO_DEFAULTS_);
    return ok(publicHeroClean_(JSON.parse(raw)));
  } catch(e) { return fail(e); }
}
/** OWNER ONLY. Saves homepage hero text, CTA links and three approved image URLs. */
function saveHomepageHero(token, input) {
  const lock=LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const u=owner_(token), clean=publicHeroClean_(input), b=blockRow_(PUBLIC_HERO_KEY_);
    put_(b.sh,b.row||(b.sh.getLastRow()+1),1,[[PUBLIC_HERO_KEY_,JSON.stringify(clean)]]);
    audit_(u,'content.save',PUBLIC_HERO_KEY_,'Homepage hero text, links and images');
    return ok(clean,'Homepage hero settings saved.');
  } catch(e) { return fail(e); }
  finally { try { lock.releaseLock(); } catch(_) {} }
}

