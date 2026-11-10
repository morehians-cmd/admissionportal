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
const PUBLIC_BLOCK_KEYS = ['pubhome','pubabout','pubadmissions','pubacademics','pubcampus','pubforms','pubnews','pubcontact'];
function getPublicBlock(key) {
  try {
    key = String(key || '');
    if (!PUBLIC_BLOCK_KEYS.includes(key)) throw new Error('Unknown public page.');
    const b = blockRow_(key);
    const html = b.row ? cleanPolicy_(String(b.sh.getRange(b.row, 2).getValue() || '')) : '';
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
