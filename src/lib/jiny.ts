/**
 * Jiny Diet (jinydiet.com/routine) monthly routine import.
 *
 * The routine page shows the month as one calendar IMAGE with clickable YouTube
 * links placed over each day (an "image map"). The page needs a login, so it is
 * read in the user's own browser by a bookmarklet: it measures where every link
 * sits on the image and opens this app with that data in the URL hash
 * (`#jiny=…`, never sent to any server). This module turns those positions into
 * dates.
 */
import type { ScheduleDay, VideoRef } from '../types';
import { daysInMonth, parseDateKey } from './date';
import { parseYouTubeId } from './youtube';

export const JINY_ROUTINE_URL = 'https://www.jinydiet.com/routine';
export const JINY_CATEGORY = '지니다이어트';

/** A link's box on the calendar image, as fractions (0–1) of the image size. */
export interface JinyAnchor {
  href: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface JinyPayload {
  app: 'daily-fit-jiny';
  v: 1;
  capturedAt?: string;
  src?: string;
  anchors: JinyAnchor[];
}

export interface JinyMapping {
  month: string;
  /** dateKey → links in that cell, top to bottom */
  days: Record<string, string[]>;
  /** links that didn't land on a date of this month */
  outside: number;
}

const HASH_KEY = 'jiny=';

export function parseJinyPayload(input: string): JinyPayload | null {
  let text = input.trim();
  if (!text) return null;
  const hashAt = text.indexOf(HASH_KEY);
  if (hashAt >= 0) text = decodeURIComponent(text.slice(hashAt + HASH_KEY.length));
  try {
    const data = JSON.parse(text) as Partial<JinyPayload>;
    if (data.app !== 'daily-fit-jiny' || !Array.isArray(data.anchors)) return null;
    const anchors = data.anchors.filter(
      (a): a is JinyAnchor =>
        !!a && typeof a.href === 'string' && [a.x, a.y, a.w, a.h].every((n) => typeof n === 'number' && Number.isFinite(n)),
    );
    if (!anchors.length) return null;
    return { app: 'daily-fit-jiny', v: 1, capturedAt: data.capturedAt, src: data.src, anchors };
  } catch {
    return null;
  }
}

/** Reads (and removes) an import payload from the page URL hash, if present. */
export function takeJinyPayloadFromHash(): JinyPayload | null {
  if (!window.location.hash.includes(HASH_KEY)) return null;
  const payload = parseJinyPayload(window.location.hash);
  history.replaceState(history.state, '', window.location.pathname + window.location.search);
  return payload;
}

/** The Jiny calendar always starts on Sunday. */
function weeksIn(month: string): number {
  const days = daysInMonth(month);
  const lead = parseDateKey(days[0]).getDay();
  return Math.ceil((lead + days.length) / 7);
}

/** Places every link on the month grid (7 columns × N week rows below a weekday header). */
export function mapToMonth(payload: JinyPayload, month: string): JinyMapping {
  const days = daysInMonth(month);
  const lead = parseDateKey(days[0]).getDay();
  const rows = weeksIn(month);
  const minY = Math.min(...payload.anchors.map((a) => a.y));
  // grid top = the first row's top; fall back to the usual header height if row 1 is empty
  const top = minY < 0.12 ? Math.max(0, minY - 0.002) : 0.049;
  const rowH = (1 - top) / rows;

  const cells: Record<string, { y: number; x: number; href: string }[]> = {};
  let outside = 0;
  for (const a of payload.anchors) {
    const cx = a.x + a.w / 2;
    const cy = a.y + a.h / 2;
    const col = Math.min(6, Math.max(0, Math.floor(cx * 7)));
    const row = Math.floor((cy - top) / rowH);
    const day = row * 7 + col - lead + 1;
    if (row < 0 || row >= rows || day < 1 || day > days.length) {
      outside++;
      continue;
    }
    (cells[days[day - 1]] ??= []).push({ y: a.y, x: a.x, href: a.href });
  }

  const out: Record<string, string[]> = {};
  for (const [key, list] of Object.entries(cells)) {
    const ordered = list.sort((p, q) => p.y - q.y || p.x - q.x).map((c) => c.href);
    // the same video twice in one cell (split hotspot) counts once
    out[key] = ordered.filter((href, i) => i === 0 || parseYouTubeId(href) !== parseYouTubeId(ordered[i - 1]));
  }
  return { month, days: out, outside };
}

/** Picks the month whose calendar layout fits the links best (around the capture date). */
export function guessMonth(payload: JinyPayload, todayKey: string): string {
  const base = (payload.capturedAt ?? todayKey).slice(0, 7);
  const [y, m] = base.split('-').map(Number);
  const candidates = [0, 1, -1, 2].map((delta) => {
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  let best = candidates[0];
  let bestScore = -Infinity;
  candidates.forEach((month, order) => {
    const map = mapToMonth(payload, month);
    const placed = payload.anchors.length - map.outside;
    const filledDays = Object.keys(map.days).length;
    // more placed links & filled days win; earlier candidates win ties
    const score = placed * 10 + filledDays - order * 0.1;
    if (score > bestScore) {
      bestScore = score;
      best = month;
    }
  });
  return best;
}

export function uniqueVideoIds(map: JinyMapping): { id: string; days: number }[] {
  const counts = new Map<string, number>();
  for (const links of Object.values(map.days))
    for (const href of links) {
      const id = parseYouTubeId(href);
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  return [...counts.entries()].map(([id, days]) => ({ id, days }));
}

/** Builds schedule entries for every date of the month (empty cells become rest days). */
export function buildScheduleDays(map: JinyMapping, nameFor: (videoId: string) => string): Record<string, ScheduleDay> {
  const out: Record<string, ScheduleDay> = {};
  for (const key of daysInMonth(map.month)) {
    const refs: VideoRef[] = [];
    for (const href of map.days[key] ?? []) {
      const id = parseYouTubeId(href);
      if (id) refs.push({ title: nameFor(id), youtubeUrl: href, category: JINY_CATEGORY });
    }
    out[key] = refs.length ? { workout1: refs[0], ...(refs[1] ? { workout2: refs[1] } : {}) } : { rest: true };
  }
  return out;
}

/**
 * Bookmarklet source. Runs on jinydiet.com/routine (logged in), finds the image
 * map with the most YouTube links and opens `appUrl#jiny=<positions>`.
 */
export function buildBookmarklet(appUrl: string): string {
  const code = `(function(){
var APP=${JSON.stringify(appUrl)};
if(location.hostname.indexOf('jinydiet.com')<0){alert('지니다이어트 [이달의 루틴] 페이지에서 실행해 주세요.');return;}
var best=null;
document.querySelectorAll('.image_map, ._img_box').forEach(function(w){
  var img=w.querySelector('img');var as=w.querySelectorAll('a[href*="youtu"]');
  if(img&&as.length&&(!best||as.length>best.as.length))best={img:img,as:as};
});
if(!best){alert('루틴 달력을 찾지 못했어요. [이달의 루틴] 페이지가 맞는지 확인해 주세요.');return;}
var ir=best.img.getBoundingClientRect();
if(!ir.width){alert('달력 이미지가 아직 로딩 중이에요. 잠시 후 다시 눌러주세요.');return;}
var r4=function(n){return Math.round(n*10000)/10000;};
var anchors=Array.prototype.map.call(best.as,function(a){var r=a.getBoundingClientRect();
  return{href:a.href,x:r4((r.left-ir.left)/ir.width),y:r4((r.top-ir.top)/ir.height),w:r4(r.width/ir.width),h:r4(r.height/ir.height)};});
var d=new Date();var p=function(n){return(n<10?'0':'')+n;};
var data={app:'daily-fit-jiny',v:1,capturedAt:d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()),src:best.img.src,anchors:anchors};
location.href=APP+'#jiny='+encodeURIComponent(JSON.stringify(data));
})();`;
  return 'javascript:' + code.replace(/\n\s*/g, '');
}

export function appBaseUrl(): string {
  return window.location.origin + window.location.pathname;
}
