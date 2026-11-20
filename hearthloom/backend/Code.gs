/**
 * Hearthloom — Google Apps Script backend
 * Gives the installed app: family sync, AI (recipes / Magic Add), Google Calendar sync.
 *
 * Setup:
 * 1. script.google.com → New project → paste this file.
 * 2. Project Settings → Script properties:
 *      FAMILY_KEY        = any secret phrase your family will type into Hearthloom
 *      ANTHROPIC_API_KEY = your Claude API key (console.anthropic.com)
 *      CALENDAR_IDS      = (optional) comma-separated calendar IDs; blank = all your calendars
 * 3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → copy the /exec URL.
 * 4. In Hearthloom: Settings → paste the URL and the family key.
 */
const P = PropertiesService.getScriptProperties();
const MODEL = 'claude-sonnet-5-5';

function doGet(e) { return out_(route_(e.parameter || {})); }
function doPost(e) {
  let q = {};
  try { q = JSON.parse(e.postData.contents); } catch (err) { return out_({ error: 'bad json' }); }
  return out_(route_(q));
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function route_(q) {
  if (!q.key || q.key !== P.getProperty('FAMILY_KEY')) return { error: 'bad key' };
  try {
    switch (q.action) {
      case 'ping': return { ok: true };
      case 'get': return getState_();
      case 'set': return setState_(q.state);
      case 'ai': return ai_(q.prompt, q.images || []);
      case 'cal': return cal_();
      case 'calAdd': return calAdd_(q.event);
      default: return { error: 'unknown action' };
    }
  } catch (err) { return { error: String(err) }; }
}

function file_() {
  let id = P.getProperty('STATE_FILE');
  if (id) { try { return DriveApp.getFileById(id); } catch (e) {} }
  const f = DriveApp.createFile('nectar-state.json', '{}', 'application/json');
  P.setProperty('STATE_FILE', f.getId());
  return f;
}
function getState_() {
  const t = file_().getBlob().getDataAsString();
  const o = JSON.parse(t || '{}');
  return { state: o.state || null, at: o.at || 0 };
}
function setState_(state) {
  if (!state || !Array.isArray(state.events)) return { error: 'bad state' };
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const at = Date.now();
    file_().setContent(JSON.stringify({ state: state, at: at }));
    return { ok: true, at: at };
  } finally { lock.releaseLock(); }
}

function ai_(prompt, images) {
  const key = P.getProperty('ANTHROPIC_API_KEY');
  if (!key) return { error: 'no api key' };
  const content = images.slice(0, 4).map(function (b64) {
    return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } };
  });
  content.push({ type: 'text', text: String(prompt).slice(0, 20000) });
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: 'user', content: content }] })
  });
  const j = JSON.parse(res.getContentText());
  if (j.error) return { error: j.error.message };
  return { text: (j.content || []).map(function (c) { return c.text || ''; }).join('') };
}

function cals_() {
  const ids = (P.getProperty('CALENDAR_IDS') || '').split(',').map(function (s) { return s.trim(); }).filter(String);
  return ids.length ? ids.map(function (id) { return CalendarApp.getCalendarById(id); }).filter(Boolean) : CalendarApp.getAllCalendars();
}
function cal_() {
  const now = new Date(), end = new Date(now.getTime() + 14 * 864e5), tz = Session.getScriptTimeZone();
  const evs = [];
  cals_().forEach(function (c) {
    c.getEvents(now, end).forEach(function (e) {
      const s = e.getStartTime();
      evs.push({ t: e.getTitle(), d: Utilities.formatDate(s, tz, 'yyyy-MM-dd'), h: e.isAllDayEvent() ? '' : Utilities.formatDate(s, tz, 'HH:mm'), cal: c.getName() });
    });
  });
  return { events: evs.slice(0, 300) };
}
function calAdd_(ev) {
  if (!ev || !ev.t || !ev.d) return { error: 'bad event' };
  const c = CalendarApp.getDefaultCalendar();
  if (ev.h) {
    const s = new Date(ev.d + 'T' + ev.h + ':00');
    c.createEvent(ev.t, s, new Date(s.getTime() + 60 * 60000), { description: 'Added from Hearthloom' + (ev.w ? ' · ' + ev.w : '') });
  } else {
    c.createAllDayEvent(ev.t, new Date(ev.d + 'T00:00:00'));
  }
  return { ok: true };
}
