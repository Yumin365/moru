import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Flame,
  Flower2,
  Palette,
  Plus,
  Repeat,
  RotateCcw,
  Smartphone,
  Trash2,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { addMonths, formatMonthTitle, monthKey, parseDateKey, weekdaysLabel } from '../../lib/date';
import { canInstall, isStandalone, onInstallChange } from '../../lib/install';
import { JINY_ROUTINE_URL } from '../../lib/jiny';
import { PRESETS } from '../../lib/palette';
import { mergeStretchDefaults, stretchDaysOn, type StretchSlot } from '../../lib/schedule';
import { useDecor } from '../../state/Decor';
import { useBackButton } from '../../state/useBackButton';
import { useBackupFile } from '../../state/useBackupFile';
import { useToast } from '../../state/Toast';
import { useStore } from '../../state/WorkoutStore';
import { HomeScreenGuide } from './HomeScreenGuide';
import { RepeatEditor, type RepeatTarget } from './RepeatEditor';
import './settings.css';

interface SettingsViewProps {
  open: boolean;
  onClose: () => void;
  onOpenJiny: () => void;
  onOpenDecor: () => void;
  onReplayGuide: () => void;
}

interface RowProps {
  icon: LucideIcon;
  title: string;
  detail?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  trailing?: ReactNode;
}

/** One settings row; a button when it has onClick, otherwise a static row with an optional control. */
function Row({ icon: Icon, title, detail, onClick, danger, trailing }: RowProps) {
  const body = (
    <>
      <span className="srow__icon">
        <Icon size={18} strokeWidth={2.3} />
      </span>
      <span className="srow__text">
        <span className="srow__title">{title}</span>
        {detail && <span className="srow__detail">{detail}</span>}
      </span>
      {trailing ?? (onClick && <ChevronRight size={18} strokeWidth={2.3} className="srow__chev" />)}
    </>
  );
  return onClick ? (
    <button type="button" className={`srow${danger ? ' srow--danger' : ''}`} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={`srow srow--static${danger ? ' srow--danger' : ''}`}>{body}</div>
  );
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`seg__opt${value === o.value ? ' is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Design-only file (theme, backgrounds, stickers, stamp + their pictures) — no workout records. */
interface DesignFile {
  app: 'daily-fit-design';
  version: 1;
  exportedAt: string;
  decor: unknown;
  images: unknown;
}

/** Accepts a design file, or a full 모루 backup that carries 꾸미기. */
function readDesign(data: unknown): { decor: unknown; images: unknown } | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.app === 'daily-fit-design' && d.decor) return { decor: d.decor, images: d.images };
  const inner = d.decor as { decor?: unknown; images?: unknown } | null | undefined;
  if (d.app === 'daily-fit' && inner?.decor) return { decor: inner.decor, images: inner.images };
  return null;
}

function decorSummary(d: ReturnType<typeof useDecor>['decor']): string {
  const parts: string[] = [];
  if (d.theme.preset !== 'plum') parts.push(d.theme.preset === 'custom' ? '직접 고른 색' : (PRESETS.find((p) => p.id === d.theme.preset)?.name ?? '테마'));
  const bgs = Object.keys(d.backgrounds).length;
  if (bgs) parts.push(`배경 ${bgs}`);
  const stickers = Object.values(d.stickers).reduce((n, l) => n + (l?.length ?? 0), 0);
  if (stickers) parts.push(`스티커 ${stickers}`);
  if (d.stamp.kind === 'custom' && d.stamp.imageId) parts.push('내 도장');
  if (d.icon) parts.push('내 아이콘');
  return parts.length ? parts.join(' · ') : '테마 색 · 배경 · 스티커 · 도장 · 아이콘';
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

/** Full-screen settings page: Jiny status → repeats → workout options → data → app → (folded) reset. */
export function SettingsView({ open, onClose, onOpenJiny, onOpenDecor, onReplayGuide }: SettingsViewProps) {
  const store = useStore();
  const { decor, exportDecor, importDecor, resetDecor } = useDecor();
  const {
    todayKey,
    stretchOverrides,
    stretchDays,
    recurring,
    imported,
    options,
    setOption,
    resetRecords,
    resetEverything,
    lastBackupAt,
  } = store;
  const toast = useToast();
  const [repeatTarget, setRepeatTarget] = useState<RepeatTarget | null>(null);
  const [confirm, setConfirm] = useState<'records' | 'all' | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [homeGuide, setHomeGuide] = useState(false);
  const [installable, setInstallable] = useState(canInstall());
  const fileRef = useRef<HTMLInputElement>(null);
  const { download, restore: upload } = useBackupFile();
  const designRef = useRef<HTMLInputElement>(null);
  const [pendingDesign, setPendingDesign] = useState<{ decor: unknown; images: unknown } | null>(null);
  useBackButton(open, onClose);

  useEffect(() => onInstallChange(() => setInstallable(canInstall())), []);
  useEffect(() => {
    if (!open) return;
    setResetOpen(false);
    document.body.classList.add('is-locked');
    return () => document.body.classList.remove('is-locked');
  }, [open]);

  if (!open) return null;

  // ① Jiny status
  const month = monthKey(todayKey);
  const nextMonth = addMonths(month, 1);
  const current = imported[month];
  const neverConnected = Object.keys(imported).length === 0;
  const currentDays = current ? Object.values(current.days).filter((d) => d.workout1).length : 0;
  // only for people who already import (a first-timer has nothing to update yet)
  const showNextHint = !neverConnected && parseDateKey(todayKey).getDate() >= 25 && !imported[nextMonth];
  const monthName = formatMonthTitle(month).month;

  // ② repeats
  const stretches = mergeStretchDefaults(stretchOverrides);
  const stretchRow = (slot: StretchSlot, label: string) => {
    const ref = stretches[slot];
    const days = stretchDaysOn(stretchDays, slot, todayKey);
    const off = !ref || days.length === 0;
    return (
      <Row
        key={slot}
        icon={Flower2}
        title={off ? `${label} 스트레칭` : ref!.title}
        detail={off ? '사용 안 함' : `${days.length === 7 ? '매일' : weekdaysLabel(days)} · ${label}`}
        onClick={() => setRepeatTarget({ kind: 'stretch', slot })}
      />
    );
  };
  const activeRules = recurring.filter((r) => !r.endDate || r.endDate >= todayKey);

  const exportDesign = async () => {
    try {
      const { decor: d, images } = await exportDecor();
      const file: DesignFile = { app: 'daily-fit-design', version: 1, exportedAt: new Date().toISOString(), decor: d, images };
      const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `moru-design-${todayKey}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ message: '디자인 파일을 저장했어요' });
    } catch {
      toast({ message: '디자인을 내보내지 못했어요' });
    }
  };

  const readDesignFile = async (file: File) => {
    try {
      const design = readDesign(JSON.parse(await file.text()));
      if (design) setPendingDesign(design);
      else toast({ message: '모루 디자인 파일이 아니에요' });
    } catch {
      toast({ message: '파일을 읽을 수 없어요' });
    }
  };

  return createPortal(
    <div className="settings-page" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="settings-page__inner">
        <header className="settings-page__head">
          <h1 id="settings-title" className="screen-title">
            설정
          </h1>
          <IconButton label="닫기" onClick={onClose}>
            <X size={20} strokeWidth={2.4} />
          </IconButton>
        </header>

        {/* ① 지니다이어트 루틴 */}
        <section className="jiny-card" aria-label="지니다이어트 루틴">
          <div className="jiny-card__label">지니다이어트 루틴</div>
          <div className="jiny-card__status">
            {current ? `${monthName} 루틴 적용 중` : `${monthName} 루틴을 아직 안 가져왔어요`}
          </div>
          <div className="jiny-card__detail">
            {current
              ? `${currentDays}일 · ${shortDate(current.importedAt)} 가져옴`
              : '이지은 다이어트 홈페이지를 연동하면 매달 루틴을 가져올 수 있어요'}
          </div>
          {showNextHint && (
            <div className="jiny-card__hint">{formatMonthTitle(nextMonth).month} 루틴이 올라왔는지 확인해 보세요</div>
          )}
          <div className="jiny-card__actions">
            {neverConnected ? (
              // first time: walk through the one-time setup first
              <button type="button" className="btn btn--primary btn--md" onClick={onOpenJiny}>
                <span className="btn__label">홈페이지 연동하는 법</span>
              </button>
            ) : (
              <>
                <a className="btn btn--primary btn--md" href={JINY_ROUTINE_URL} target="_blank" rel="noreferrer">
                  <span className="btn__label">{current && !showNextHint ? '루틴 페이지 열기' : '이번 달 루틴 가져오기'}</span>
                  <span className="btn__icon">
                    <ExternalLink size={16} strokeWidth={2.4} />
                  </span>
                </a>
                <button type="button" className="jiny-card__link" onClick={onOpenJiny}>
                  루틴 가져오는 법
                </button>
              </>
            )}
          </div>
        </section>

        {/* ② 반복 루틴 */}
        <section className="sgroup">
          <h3 className="sgroup__title">반복 루틴</h3>
          <div className="sgroup__card">
            {stretchRow('stretch1', '시작')}
            {stretchRow('stretch2', '마무리')}
            {activeRules.map((rule) => (
              <Row
                key={rule.id}
                icon={Repeat}
                title={rule.title}
                detail={`${rule.weekdays.length === 7 ? '매일' : weekdaysLabel(rule.weekdays)} · ${rule.type === 'stretch' ? '스트레칭' : '운동'}`}
                onClick={() => setRepeatTarget({ kind: 'rule', id: rule.id })}
              />
            ))}
            <button type="button" className="srow srow--add" onClick={() => setRepeatTarget({ kind: 'new' })}>
              <span className="srow__icon">
                <Plus size={18} strokeWidth={2.6} />
              </span>
              <span className="srow__text">
                <span className="srow__title">반복 영상 추가</span>
              </span>
            </button>
          </div>
        </section>

        {/* ③ 운동 설정 */}
        <section className="sgroup">
          <h3 className="sgroup__title">운동 설정</h3>
          <div className="sgroup__card">
            <Row
              icon={Flame}
              title="연속 기록 기준"
              trailing={
                <Segmented
                  label="연속 기록 기준"
                  value={options.countPartialDays ? 'any' : 'full'}
                  options={[
                    { value: 'any', label: '1개 이상' },
                    { value: 'full', label: '모두 완료' },
                  ]}
                  onChange={(v) => setOption('countPartialDays', v === 'any')}
                />
              }
            />
            <Row
              icon={CalendarDays}
              title="캘린더 시작 요일"
              trailing={
                <Segmented
                  label="캘린더 시작 요일"
                  value={options.weekStartsOn}
                  options={[
                    { value: 0, label: '일' },
                    { value: 1, label: '월' },
                  ]}
                  onChange={(v) => setOption('weekStartsOn', v)}
                />
              }
            />
          </div>
        </section>

        {/* ④ 꾸미기 */}
        <section className="sgroup">
          <h3 className="sgroup__title">화면</h3>
          <div className="sgroup__card">
            <Row icon={Palette} title="꾸미기" detail={decorSummary(decor)} onClick={onOpenDecor} />
            <Row icon={Download} title="디자인 내보내기" detail="꾸미기만 파일로 저장 · 운동 기록 제외" onClick={() => void exportDesign()} />
            <Row icon={Upload} title="디자인 가져오기" detail="받은 디자인 파일로 꾸미기 바꾸기" onClick={() => designRef.current?.click()} />
          </div>
          <input
            ref={designRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readDesignFile(file);
              e.target.value = '';
            }}
          />
        </section>

        {/* ⑤ 데이터 */}
        <section className="sgroup">
          <h3 className="sgroup__title">데이터</h3>
          <div className="sgroup__card">
            <Row
              icon={Download}
              title="백업 내보내기"
              detail={lastBackupAt ? `마지막 백업: ${shortDate(lastBackupAt)}` : '아직 백업한 적 없어요'}
              onClick={() => void download()}
            />
            <Row icon={Upload} title="백업 가져오기" detail=".json 백업 파일로 복원" onClick={() => fileRef.current?.click()} />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = '';
            }}
          />
        </section>

        {/* ⑥ 앱 */}
        <section className="sgroup">
          <h3 className="sgroup__title">앱</h3>
          <div className="sgroup__card">
            <Row
              icon={Smartphone}
              title="홈 화면에 추가하는 방법"
              detail={
                isStandalone()
                  ? '이미 홈 화면 앱으로 쓰고 있어요'
                  : installable
                    ? '이 기기에서 바로 설치할 수 있어요'
                    : '주소창 없이 앱처럼 쓰는 방법'
              }
              onClick={() => setHomeGuide(true)}
            />
            <Row icon={BookOpen} title="사용법 다시 보기" detail="처음 시작 안내와 도움말 팁을 다시 보여 줘요" onClick={onReplayGuide} />
          </div>
          <p className="settings__foot">모루 v{__APP_VERSION__} · 모든 기록은 이 기기에만 저장돼요</p>
        </section>

        {/* ⑦ 초기화 (접힘) */}
        <section className="sgroup sgroup--reset">
          <button
            type="button"
            className={`reset-toggle${resetOpen ? ' is-open' : ''}`}
            onClick={() => setResetOpen((o) => !o)}
            aria-expanded={resetOpen}
          >
            초기화
            <ChevronDown size={16} strokeWidth={2.4} />
          </button>
          {resetOpen && (
            <div className="sgroup__card">
              <Row icon={RotateCcw} title="운동 기록 초기화" detail="모든 완료 기록을 삭제해요" danger onClick={() => setConfirm('records')} />
              <Row icon={Trash2} title="전체 초기화" detail="기록, 편집한 루틴, 반복, 가져온 루틴, 꾸미기 모두" danger onClick={() => setConfirm('all')} />
            </div>
          )}
        </section>
      </div>

      <RepeatEditor target={repeatTarget} onClose={() => setRepeatTarget(null)} />
      <HomeScreenGuide open={homeGuide} onClose={() => setHomeGuide(false)} />

      <ConfirmDialog
        open={pendingDesign !== null}
        icon={<Upload size={22} strokeWidth={2.2} />}
        title="이 디자인으로 바꿀까요?"
        message="지금 꾸미기(테마 색·배경·스티커·도장·아이콘)가 가져온 디자인으로 바뀌어요. 운동 기록은 그대로예요."
        confirmLabel="바꾸기"
        onCancel={() => setPendingDesign(null)}
        onConfirm={async () => {
          const design = pendingDesign;
          setPendingDesign(null);
          if (!design) return;
          const ok = await importDecor(design.decor, design.images).catch(() => false);
          toast({ message: ok ? '디자인을 가져왔어요' : '디자인을 가져오지 못했어요' });
        }}
      />
      <ConfirmDialog
        open={confirm === 'records'}
        destructive
        icon={<RotateCcw size={22} strokeWidth={2.2} />}
        title="운동 기록을 초기화할까요?"
        message="이 기기의 모든 완료 기록, 연속 기록, 통계가 삭제돼요. 되돌릴 수 없어요."
        confirmLabel="초기화"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          resetRecords();
          setConfirm(null);
          toast({ message: '운동 기록을 초기화했어요' });
        }}
      />
      <ConfirmDialog
        open={confirm === 'all'}
        destructive
        icon={<Trash2 size={22} strokeWidth={2.2} />}
        title="전체 초기화할까요?"
        message="기록, 편집한 루틴, 반복 영상, 가져온 지니 루틴, 스트레칭 설정, 꾸미기가 모두 삭제돼요. 되돌릴 수 없어요."
        confirmLabel="전체 초기화"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          resetEverything();
          resetDecor();
          setConfirm(null);
          toast({ message: '앱을 초기화했어요' });
        }}
      />
    </div>,
    document.body,
  );
}
