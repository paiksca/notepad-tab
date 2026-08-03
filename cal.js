// Fetches one or more Google Calendar secret iCal URLs, shows the next event
// up top and the whole day's agenda in a sidebar.
const caltext = document.getElementById('caltext');
const gear = document.getElementById('calgear');
const panel = document.getElementById('calpanel');
const urlInput = document.getElementById('calurl');
const agendaEl = document.getElementById('agenda');
const agendaList = document.getElementById('agendalist');
const agendaNote = document.getElementById('agendanote');

const DAY = 86400000;
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const HORIZON = 14 * DAY;

let urls = [];

gear.addEventListener('click', () => {
  panel.hidden = !panel.hidden;
  if (!panel.hidden) urlInput.focus();
});

document.getElementById('calsave').addEventListener('click', () => {
  urls = urlInput.value.split('\n').map((s) => s.trim()).filter(Boolean);
  chrome.storage.local.set({ icsUrls: urls });
  panel.hidden = true;
  caltext.textContent = '';
  agendaEl.hidden = true;
  if (urls.length) refresh();
});

chrome.storage.local.get({ icsUrl: '', icsUrls: null, calCache: null }, (r) => {
  urls = r.icsUrls ?? (r.icsUrl ? [r.icsUrl] : []); // migrate from single-URL version
  urlInput.value = urls.join('\n');
  if (r.calCache && r.calCache.day === startOfDay(new Date())) render(r.calCache);
  if (urls.length) refresh();
  setInterval(() => { if (urls.length) refresh(); }, 5 * 60 * 1000);
});

async function refresh() {
  const results = await Promise.allSettled(urls.map((u) =>
    fetch(u, { cache: 'no-store' }).then((res) => {
      if (!res.ok) throw new Error(res.status);
      return res.text();
    })
  ));
  const events = results.filter((x) => x.status === 'fulfilled').flatMap((x) => parseICS(x.value));
  const failed = results.length - results.filter((x) => x.status === 'fulfilled').length;
  if (!events.length && failed) {
    caltext.textContent = 'calendar unavailable';
    return;
  }

  const now = new Date();
  const dayStart = startOfDay(now);
  const agenda = [];
  const tomorrow = [];
  let next = null;
  for (const ev of events) {
    for (const t of occurrencesBetween(ev, new Date(dayStart), new Date(dayStart + 2 * DAY - 1))) {
      (t.getTime() < dayStart + DAY ? agenda : tomorrow)
        .push({ summary: ev.summary, when: t.getTime(), allDay: ev.allDay });
    }
    const up = occurrencesBetween(ev, now, new Date(now.getTime() + HORIZON))[0];
    if (up && (!next || up.getTime() < next.when)) {
      next = { summary: ev.summary, when: up.getTime(), allDay: ev.allDay };
    }
  }
  const byTime = (a, b) => a.when - b.when || (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0);
  agenda.sort(byTime);
  tomorrow.sort(byTime);

  const cache = { day: dayStart, agenda, tomorrow, next, failed };
  render(cache);
  chrome.storage.local.set({ calCache: cache });
}

function render({ agenda, tomorrow, next, failed }) {
  const now = new Date();

  // top bar: next upcoming event
  caltext.textContent = '';
  if (next) {
    const d = new Date(next.when);
    const dayDiff = Math.round((startOfDay(d) - startOfDay(now)) / DAY);
    const day = dayDiff === 0 ? 'today' : dayDiff === 1 ? 'tomorrow'
      : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const time = next.allDay ? '' : ' ' + fmtTime(d);
    const b = document.createElement('b');
    b.textContent = next.summary;
    caltext.append('next: ', b, ` · ${day}${time}`);
  }

  // sidebar: today's and tomorrow's agendas
  tomorrow = tomorrow || [];
  agendaEl.hidden = !(agenda?.length || tomorrow.length || urls.length);
  fillList(agendaList, agenda || [], now, true, next);
  if (!agenda?.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'no events today';
    agendaList.append(li);
  }
  document.getElementById('tmrwhead').hidden = !tomorrow.length;
  fillList(document.getElementById('agendalist2'), tomorrow, now, false, next);
  agendaNote.textContent = failed ? `${failed} calendar${failed > 1 ? 's' : ''} unavailable` : '';
}

function fillList(listEl, items, now, isToday, next) {
  listEl.textContent = '';
  for (const it of items) {
    const li = document.createElement('li');
    if (isToday && !it.allDay && it.when <= now.getTime()) li.className = 'past';
    if (next && !it.allDay && it.when === next.when && it.summary === next.summary) li.className = 'next';
    const t = document.createElement('span');
    t.className = 't';
    t.textContent = it.allDay ? 'all day' : fmtTime(new Date(it.when));
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = it.summary;
    li.append(t, title);
    listEl.append(li);
  }
}

function fmtTime(d) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// --- iCal parsing ---

// UTC-vs-wall-clock difference for an IANA timezone at a given moment
function tzOffset(tz, date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date);
  const v = {};
  for (const p of parts) if (p.type !== 'literal') v[p.type] = +p.value;
  return Date.UTC(v.year, v.month - 1, v.day, v.hour % 24, v.minute, v.second) - date.getTime();
}

// wall-clock [y, month0, d, h, mi, s] in tz → absolute Date; null if tz is unknown
function fromZoned(p, tz) {
  try {
    const wall = Date.UTC(p[0], p[1], p[2], p[3], p[4], p[5]);
    let ts = wall - tzOffset(tz, new Date(wall));
    ts = wall - tzOffset(tz, new Date(ts)); // second pass converges across DST edges
    return new Date(ts);
  } catch {
    return null;
  }
}

function parseICalDate(val, tzid) {
  let m;
  if ((m = val.match(/^(\d{4})(\d{2})(\d{2})$/)))
    return { d: new Date(+m[1], +m[2] - 1, +m[3]), allDay: true };
  if ((m = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/))) {
    const p = [+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]];
    if (m[7]) return { d: new Date(Date.UTC(...p)), allDay: false };
    if (tzid) {
      const d = fromZoned(p, tzid);
      if (d) return { d, allDay: false, wall: { h: p[3], mi: p[4], s: p[5], tz: tzid } };
    }
    return { d: new Date(...p), allDay: false };
  }
  return null;
}

function parseICS(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const events = [];
  let ev = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { ev = { exdates: new Set() }; continue; }
    if (line === 'END:VEVENT') { if (ev) events.push(ev); ev = null; continue; }
    if (!ev) continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    const [name, ...params] = line.slice(0, i).split(';');
    const tzid = params.find((p) => p.startsWith('TZID='))?.slice(5);
    const val = line.slice(i + 1);
    if (name === 'SUMMARY') {
      ev.summary = val.replace(/\\([,;nN])/g, (_, c) => (c === ',' || c === ';') ? c : ' ');
    } else if (name === 'DTSTART') {
      const p = parseICalDate(val, tzid);
      if (p) { ev.start = p.d; ev.allDay = p.allDay; ev.wall = p.wall; }
    } else if (name === 'RRULE') {
      ev.rrule = Object.fromEntries(val.split(';').map((s) => s.split('=')));
    } else if (name === 'EXDATE') {
      for (const v of val.split(',')) {
        const p = parseICalDate(v, tzid);
        if (p) ev.exdates.add(p.d.getTime());
      }
    } else if (name === 'STATUS' && val === 'CANCELLED') {
      ev.cancelled = true;
    } else if (name === 'UID') {
      ev.uid = val;
    } else if (name === 'RECURRENCE-ID') {
      const p = parseICalDate(val, tzid);
      if (p) ev.recurrenceId = p.d.getTime();
    }
  }
  // a moved/edited instance replaces that occurrence of its recurring master
  const overrides = new Map();
  for (const e of events) {
    if (e.recurrenceId && e.uid) {
      if (!overrides.has(e.uid)) overrides.set(e.uid, []);
      overrides.get(e.uid).push(e.recurrenceId);
    }
  }
  for (const e of events) {
    if (e.rrule && e.uid && overrides.has(e.uid)) {
      for (const t of overrides.get(e.uid)) e.exdates.add(t);
    }
  }
  return events.filter((e) => e.start && e.summary && !e.cancelled);
}

// occurrence on calendar day (y, month0, d) at the event's start time,
// resolved through the event's own timezone when it has one
function atTimeOf(ev, y, mo, d) {
  if (ev.wall) {
    const t = fromZoned([y, mo, d, ev.wall.h, ev.wall.mi, ev.wall.s], ev.wall.tz);
    if (t) return t;
  }
  const s = ev.start;
  return new Date(y, mo, d, s.getHours(), s.getMinutes(), s.getSeconds());
}

// walk occurrences forward from DTSTART; collect every one inside [from, to]
function occurrencesBetween(ev, from, to) {
  const out = [];
  const ok = (d) => d >= from && d <= to && !ev.exdates.has(d.getTime());

  if (!ev.rrule) {
    if (ok(ev.start)) out.push(ev.start);
    return out;
  }

  const r = ev.rrule;
  const interval = +(r.INTERVAL || 1);
  let count = r.COUNT ? +r.COUNT : Infinity;
  const until = r.UNTIL ? parseICalDate(r.UNTIL)?.d : null;
  const stop = (d) => d > to || (until && d > until);
  const s = ev.start;

  if (r.FREQ === 'WEEKLY') {
    const byday = (r.BYDAY ? r.BYDAY.split(',') : [DAYS[s.getDay()]])
      .map((x) => DAYS.indexOf(x.slice(-2)))
      .filter((x) => x >= 0);
    const week0 = startOfDay(s) - s.getDay() * DAY;
    const d = new Date(startOfDay(s));
    for (let i = 0; i < 40000 && count > 0; i++, d.setDate(d.getDate() + 1)) {
      if (!byday.includes(d.getDay())) continue;
      const weeks = Math.round((startOfDay(d) - d.getDay() * DAY - week0) / (7 * DAY));
      if (weeks % interval !== 0) continue;
      const t = atTimeOf(ev, d.getFullYear(), d.getMonth(), d.getDate());
      if (t < s) continue;
      if (stop(t)) break;
      count--;
      if (ok(t)) out.push(t);
    }
    return out;
  }

  const step = { DAILY: (k) => atTimeOf(ev, s.getFullYear(), s.getMonth(), s.getDate() + k * interval),
                 MONTHLY: (k) => atTimeOf(ev, s.getFullYear(), s.getMonth() + k * interval, s.getDate()),
                 YEARLY: (k) => atTimeOf(ev, s.getFullYear() + k * interval, s.getMonth(), s.getDate()) }[r.FREQ];
  if (!step) return out;
  for (let k = 0; k < 20000 && count > 0; k++, count--) {
    const t = step(k);
    if (stop(t)) break;
    if (ok(t)) out.push(t);
  }
  return out;
}
