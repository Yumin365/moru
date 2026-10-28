import { useCallback, useEffect, useState } from 'react';
import { BottomNavigation, type TabId } from './components/BottomNavigation';
import { StampInkFilter } from './components/Stamp';
import { CalendarView } from './features/calendar/CalendarView';
import { DecorPage } from './features/decor/DecorPage';
import { Onboarding } from './features/onboarding/Onboarding';
import { ScreenDecor } from './features/decor/ScreenDecor';
import { JinyImportSheet } from './features/import/JinyImportSheet';
import { WorkoutSession } from './features/player/WorkoutSession';
import { RoutineEditor } from './features/routine/RoutineEditor';
import { SettingsView } from './features/settings/SettingsView';
import { StatsView } from './features/stats/StatsView';
import { TodayView } from './features/today/TodayView';
import { enterFullscreen } from './lib/fullscreen';
import { takeJinyPayloadFromHash, type JinyPayload } from './lib/jiny';
import { needsOnboarding, restartOnboarding } from './lib/onboarding';
import { loadYouTubeApi } from './lib/youtube';
import { useDecor } from './state/Decor';
import { useBackButton } from './state/useBackButton';
import { useStore } from './state/WorkoutStore';
import type { RoutineItem } from './types';

interface Session {
  dateKey: string;
  items: RoutineItem[];
  id: number;
}

/** App shell: tab navigation (no router → no GitHub Pages 404s) + full-screen overlays. */
export function App() {
  const { todayKey, records, imported } = useStore();
  const [tab, setTab] = useState<TabId>('today');
  const [calendarFocus, setCalendarFocus] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [decorOpen, setDecorOpen] = useState(false);
  // First launch → short guide (people who already have records skip it).
  const [guideOpen, setGuideOpen] = useState(
    () => needsOnboarding(Object.keys(records).length > 0 || Object.keys(imported).length > 0) && !window.location.hash.includes('jiny='),
  );
  const { editing, setEditing } = useDecor();
  const [editDate, setEditDate] = useState<string | null>(null);
  // Opened by the Jiny bookmarklet (app URL + #jiny=…) or from Settings.
  const [jiny, setJiny] = useState<{ open: boolean; payload: JinyPayload | null }>(() => {
    const payload = takeJinyPayloadFromHash();
    return { open: payload !== null, payload };
  });

  useEffect(() => {
    const onHash = () => {
      const payload = takeJinyPayloadFromHash();
      if (payload) setJiny({ open: true, payload });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Load the YouTube player API in the background so START WORKOUT plays instantly.
  useEffect(() => {
    const t = window.setTimeout(() => void loadYouTubeApi().catch(() => {}), 800);
    return () => clearTimeout(t);
  }, []);

  // Arranging stickers happens on the real screen.
  useEffect(() => {
    if (editing) {
      setTab(editing);
      setCalendarFocus(null);
    }
  }, [editing]);

  // Android back on 캘린더/통계 returns to 오늘 first (then the next back leaves the app).
  useBackButton(tab !== 'today' && session === null && editing === null, () => {
    setTab('today');
    setCalendarFocus(null);
    window.scrollTo({ top: 0 });
  });

  const changeTab = useCallback((next: TabId) => {
    setTab(next);
    setEditing(null);
    if (next !== 'calendar') setCalendarFocus(null);
    window.scrollTo({ top: 0 });
  }, [setEditing]);

  return (
    <div className="app">
      <StampInkFilter />
      <main className="app__main" hidden={session !== null}>
        <ScreenDecor key={tab} screen={tab}>
        {tab === 'today' && (
          <TodayView
            onStartSession={(items) => {
              enterFullscreen(); // still inside the tap → allowed by the browser
              setSession({ dateKey: todayKey, items, id: Date.now() });
            }}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenDay={(key) => {
              setCalendarFocus(key);
              setTab('calendar');
              window.scrollTo({ top: 0 });
            }}
            onEditRoutine={setEditDate}
          />
        )}
        {tab === 'calendar' && <CalendarView focusDate={calendarFocus} onEditRoutine={setEditDate} />}
        {tab === 'stats' && <StatsView />}
        </ScreenDecor>
      </main>

      {session === null && editing === null && <BottomNavigation active={tab} onChange={changeTab} />}

      {session && (
        <WorkoutSession
          key={session.id}
          dateKey={session.dateKey}
          items={session.items}
          onExit={() => {
            setSession(null);
            setTab('today');
          }}
        />
      )}

      <SettingsView
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenJiny={() => setJiny({ open: true, payload: null })}
        onOpenDecor={() => setDecorOpen(true)}
        onReplayGuide={() => {
          restartOnboarding();
          setSettingsOpen(false);
          setTab('today');
          setGuideOpen(true);
        }}
      />
      <Onboarding open={guideOpen} onClose={() => setGuideOpen(false)} onOpenJiny={() => setJiny({ open: true, payload: null })} />
      <DecorPage
        open={decorOpen}
        onClose={() => setDecorOpen(false)}
        onArrange={(screen) => {
          setDecorOpen(false);
          setSettingsOpen(false);
          setEditing(screen);
          window.scrollTo({ top: 0 });
        }}
      />
      <RoutineEditor dateKey={editDate} onClose={() => setEditDate(null)} />
      <JinyImportSheet open={jiny.open} payload={jiny.payload} onClose={() => setJiny({ open: false, payload: null })} />
    </div>
  );
}
