import { AlertTriangle, Check, ImagePlus, Move, Play, RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../../components/Button';
import { Toggle } from '../../components/Checkbox';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImageEditor, type EditedImage, type ImagePurpose } from '../../components/ImageEditor';
import { STAMP_COLOR_LABEL, stampColor } from '../../components/Stamp';
import { PRESETS, DEFAULT_THEME, themeWarnings, type NeutralTone, type ThemeChoice } from '../../lib/palette';
import {
  DECOR_SCREENS,
  DEFAULT_STAMP,
  MAX_STICKERS,
  useDecor,
  useAppIconUrl,
  useImageUrl,
  type DecorScreen,
  type ScreenBackground,
  type StampColor,
  type Sticker,
} from '../../state/Decor';
import { useBackButton } from '../../state/useBackButton';
import { useToast } from '../../state/Toast';
import { useIconFlow } from './IconFlow';
import { BackgroundPreview, IconPreview, MiniScreen, StampPreview, StickerPreview } from './previews';
import { newStickerId } from './ScreenDecor';
import './decor.css';

type Tab = 'theme' | 'background' | 'sticker' | 'stamp' | 'icon';
const TABS: { id: Tab; label: string }[] = [
  { id: 'theme', label: '테마 색' },
  { id: 'background', label: '배경' },
  { id: 'sticker', label: '스티커' },
  { id: 'stamp', label: '도장' },
  { id: 'icon', label: '아이콘' },
];

const NEUTRAL_LABEL: Record<NeutralTone, string> = { warm: '따뜻한', neutral: '중립', cool: '차가운' };
const DEFAULT_BG: Omit<ScreenBackground, 'imageId'> = { blur: 0, veil: 0.35, glass: true };

interface DecorPageProps {
  open: boolean;
  onClose: () => void;
  /** leave the page and arrange stickers on that screen */
  onArrange: (screen: DecorScreen) => void;
}

function Choice<T extends string>({ value, options, onChange, label, wide }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string; wide?: boolean }) {
  return (
    <div className={`seg${wide ? ' seg--wide' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
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

function OptionRow({ title, detail, children }: { title: string; detail?: ReactNode; children: ReactNode }) {
  return (
    <div className="srow">
      <span className="srow__text">
        <span className="srow__title">{title}</span>
        {detail && <span className="srow__detail srow__detail--wrap">{detail}</span>}
      </span>
      {children}
    </div>
  );
}

function SliderRow({ title, value, min, max, step, format, onChange }: { title: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div className="srow srow--slider">
      <span className="srow__title">{title}</span>
      <input type="range" className="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={title} />
      <span className="srow__value num">{format(value)}</span>
    </div>
  );
}

// ── ① theme ─────────────────────────────────────────────
function ThemeTab() {
  const { decor, setTheme } = useDecor();
  const theme = decor.theme;
  const warnings = themeWarnings(theme);
  const custom = theme.preset === 'custom';
  const setCustom = (patch: Partial<ThemeChoice>) => setTheme({ ...theme, ...patch, preset: 'custom' });

  return (
    <>
      <div className="theme-preview" aria-hidden="true">
        <div className="theme-preview__hero">
          <span className="theme-preview__label">오늘의 운동</span>
          <span className="theme-preview__count num">3/4</span>
          <span className="theme-preview__ring" />
        </div>
        <div className="theme-preview__cal">
          {[0, 1, 2, 3, 2, 3, 's'].map((l, i) => (
            <span key={i} className={`theme-preview__cell${l === 's' ? ' is-strength' : ` l${l}`}`} />
          ))}
        </div>
        <div className="theme-preview__row">
          <span className="theme-preview__btn">운동 시작</span>
          <span className="theme-preview__chip">근력</span>
        </div>
      </div>

      <section className="sgroup">
        <h3 className="sgroup__title">추천 색 조합</h3>
        <div className="presets">
          {PRESETS.map((p) => {
            const on = theme.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`preset${on ? ' is-on' : ''}`}
                onClick={() => setTheme({ preset: p.id, accent: p.accent, secondary: p.secondary, neutral: p.neutral })}
                aria-pressed={on}
              >
                <span className="preset__swatch">
                  <span style={{ background: p.accent }} />
                  <span style={{ background: p.secondary }} />
                </span>
                <span className="preset__name">{p.name}</span>
                {on && (
                  <span className="preset__check">
                    <Check size={12} strokeWidth={3.4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="sgroup">
        <h3 className="sgroup__title">직접 고르기{custom ? ' · 사용 중' : ''}</h3>
        <div className="sgroup__card">
          <label className="srow srow--color">
            <span className="srow__text">
              <span className="srow__title">메인 색</span>
              <span className="srow__detail">버튼 · 진행 막대 · 완료한 날</span>
            </span>
            <span className="color-pick" style={{ background: theme.accent }}>
              <input type="color" value={theme.accent} onChange={(e) => setCustom({ accent: e.target.value })} aria-label="메인 색" />
            </span>
          </label>
          <label className="srow srow--color">
            <span className="srow__text">
              <span className="srow__title">보조 색</span>
              <span className="srow__detail">근력 운동한 날 · 차트</span>
            </span>
            <span className="color-pick" style={{ background: theme.secondary }}>
              <input type="color" value={theme.secondary} onChange={(e) => setCustom({ secondary: e.target.value })} aria-label="보조 색" />
            </span>
          </label>
          <OptionRow title="바탕 톤">
            <Choice
              label="바탕 톤"
              value={theme.neutral}
              options={(['warm', 'neutral', 'cool'] as NeutralTone[]).map((v) => ({ value: v, label: NEUTRAL_LABEL[v] }))}
              onChange={(neutral) => setCustom({ neutral })}
            />
          </OptionRow>
        </div>
        {warnings.map((w) => (
          <p key={w.message} className="decor-warn">
            <AlertTriangle size={15} strokeWidth={2.4} aria-hidden="true" /> {w.message}
          </p>
        ))}
        {theme.preset !== DEFAULT_THEME.preset && (
          <button type="button" className="decor-link" onClick={() => setTheme(DEFAULT_THEME)}>
            <RotateCcw size={14} strokeWidth={2.4} /> 기본 색으로 되돌리기
          </button>
        )}
      </section>
    </>
  );
}

// ── ② background ────────────────────────────────────────
function BgScreenButton({ id, label, on, shared, onToggle }: { id: DecorScreen; label: string; on: boolean; shared: boolean; onToggle: () => void }) {
  const { decor } = useDecor();
  const bg = decor.backgrounds[id];
  const url = useImageUrl(bg?.imageId);
  return (
    <button type="button" className={`bg-screen${on ? ' is-on' : ''}`} onClick={onToggle} aria-pressed={on}>
      <span className="bg-screen__thumb">
        {url ? <img src={url} alt="" /> : <span className="bg-screen__empty">없음</span>}
        <span className="bg-screen__check" aria-hidden="true">
          {on && <Check size={12} strokeWidth={3.4} />}
        </span>
      </span>
      <span className="bg-screen__label">{label}</span>
      {shared && <span className="bg-screen__shared">같은 배경</span>}
    </button>
  );
}

function BackgroundTab({ screens, onScreens, onUpload }: { screens: DecorScreen[]; onScreens: (s: DecorScreen[]) => void; onUpload: () => void }) {
  const { decor, setBackground } = useDecor();
  const primary = screens[0];
  const bg = decor.backgrounds[primary];
  const url = useImageUrl(bg?.imageId);
  const chosen = screens.map((s) => decor.backgrounds[s]);
  const mixed = chosen.some((b) => b?.imageId !== bg?.imageId);
  const anyBg = chosen.some(Boolean);
  // settings change on every chosen screen (each keeps its own picture)
  const update = (patch: Partial<ScreenBackground>) =>
    screens.forEach((s) => {
      const b = decor.backgrounds[s];
      if (b) setBackground(s, { ...b, ...patch });
    });
  const toggle = (id: DecorScreen) => {
    if (screens.includes(id)) {
      if (screens.length > 1) onScreens(screens.filter((s) => s !== id));
    } else {
      onScreens(DECOR_SCREENS.map((s) => s.id).filter((s) => s === id || screens.includes(s)));
    }
  };
  const ids = DECOR_SCREENS.map((s) => decor.backgrounds[s.id]?.imageId);
  const isShared = (id: string | undefined) => !!id && ids.filter((x) => x === id).length > 1;
  const names = screens.map((s) => DECOR_SCREENS.find((d) => d.id === s)!.label).join('·');
  const many = screens.length > 1;

  return (
    <>
      <section className="sgroup bg-pick">
        <h3 className="sgroup__title">꾸밀 화면</h3>
        <div className="bg-screens">
          {DECOR_SCREENS.map((s) => (
            <BgScreenButton
              key={s.id}
              id={s.id}
              label={s.label}
              on={screens.includes(s.id)}
              shared={isShared(decor.backgrounds[s.id]?.imageId)}
              onToggle={() => toggle(s.id)}
            />
          ))}
        </div>
        <p className="settings__foot">여러 화면을 고르면 같은 배경이 함께 들어가요. 화면마다 다르게 하려면 하나씩 골라서 바꿔 주세요.</p>
      </section>

      <div className="decor-stage">
        {bg && url ? <BackgroundPreview url={url} bg={bg} /> : <MiniScreen />}
        <div className="decor-stage__side">
          <button type="button" className="btn btn--dark btn--md" onClick={onUpload}>
            <span className="btn__icon">
              <ImagePlus size={17} strokeWidth={2.4} />
            </span>
            <span className="btn__label">{anyBg ? '사진 바꾸기' : '사진 고르기'}</span>
          </button>
          {anyBg && (
            <button type="button" className="btn btn--ghost btn--md" onClick={() => screens.forEach((s) => setBackground(s, null))}>
              <span className="btn__icon">
                <Trash2 size={16} strokeWidth={2.4} />
              </span>
              <span className="btn__label">배경 없애기</span>
            </button>
          )}
          <p className="decor-stage__note">
            {many && mixed
              ? `${names} 배경이 지금은 서로 달라요. 사진을 고르면 모두 같은 배경이 돼요.`
              : many
                ? `${names} 화면에 함께 적용돼요.`
                : anyBg
                  ? `${names} 화면에만 적용돼요.`
                  : '사진을 고르면 자르고 돌려서 화면에 맞출 수 있어요.'}
          </p>
        </div>
      </div>

      {bg && (
        <section className="sgroup">
          <h3 className="sgroup__title">보기 좋게{many ? ` · ${names}` : ''}</h3>
          <div className="sgroup__card">
            <SliderRow title="흐림" value={bg.blur} min={0} max={20} step={1} format={(v) => (v ? `${v}` : '없음')} onChange={(blur) => update({ blur })} />
            <SliderRow title="밝게 덮기" value={bg.veil} min={0} max={0.85} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(veil) => update({ veil })} />
            <OptionRow title="반투명 카드" detail="카드 너머로 배경이 살짝 비쳐요">
              <Toggle checked={bg.glass} onChange={(glass) => update({ glass })} label="반투명 카드" />
            </OptionRow>
          </div>
        </section>
      )}
    </>
  );
}

// ── ③ stickers ──────────────────────────────────────────
function StickerThumb({ sticker, onRemove }: { sticker: Sticker; onRemove: () => void }) {
  const url = useImageUrl(sticker.imageId);
  return (
    <div className="sthumb">
      {url && <img src={url} alt="" />}
      <button type="button" className="sthumb__remove" onClick={onRemove} aria-label="스티커 삭제">
        <X size={13} strokeWidth={3} />
      </button>
    </div>
  );
}

function StickerTab({ screen, onUpload, onArrange }: { screen: DecorScreen; onUpload: () => void; onArrange: () => void }) {
  const { decor, removeSticker } = useDecor();
  const list = decor.stickers[screen] ?? [];
  const label = DECOR_SCREENS.find((s) => s.id === screen)!.label;

  return (
    <>
      <section className="sgroup">
        <h3 className="sgroup__title">
          {label} 화면 스티커 <span className="num">{list.length}/{MAX_STICKERS}</span>
        </h3>
        <div className="sthumbs">
          {list.map((s) => (
            <StickerThumb key={s.id} sticker={s} onRemove={() => removeSticker(screen, s.id)} />
          ))}
          {list.length < MAX_STICKERS && (
            <button type="button" className="sthumb sthumb--add" onClick={onUpload}>
              <ImagePlus size={22} strokeWidth={2.2} />
              <span>내 이미지</span>
            </button>
          )}
        </div>
        <p className="settings__foot">사진을 올리면 원하는 부분만 잘라서 스티커로 만들 수 있어요. 배경이 투명한 PNG도 그대로 돼요.</p>
      </section>
      <button type="button" className="btn btn--primary btn--lg btn--block decor-arrange" onClick={onArrange}>
        <span className="btn__icon">
          <Move size={18} strokeWidth={2.4} />
        </span>
        <span className="btn__label">{label} 화면에서 위치 꾸미기</span>
      </button>
    </>
  );
}

// ── ④ stamp ─────────────────────────────────────────────
function StampTab({ onUpload }: { onUpload: () => void }) {
  const { decor, setStamp } = useDecor();
  const stamp = decor.stamp;
  const url = useImageUrl(stamp.imageId);
  const [play, setPlay] = useState(0);
  const custom = stamp.kind === 'custom' && !!stamp.imageId;
  const coloured = !custom || stamp.tint;

  return (
    <>
      <div className="decor-stage decor-stage--stamp">
        <StampPreview settings={{ ...stamp, kind: custom ? 'custom' : 'builtin' }} imageUrl={url} play={play} />
        {stamp.animate && (
          <button type="button" className="decor-replay" onClick={() => setPlay((p) => p + 1)} aria-label="도장 다시 찍어 보기">
            <Play size={14} strokeWidth={0} fill="currentColor" /> 다시 찍기
          </button>
        )}
      </div>

      <section className="sgroup">
        <h3 className="sgroup__title">도장 모양</h3>
        <div className="stamp-kinds">
          <button
            type="button"
            className={`stamp-kind${!custom ? ' is-on' : ''}`}
            onClick={() => setStamp({ kind: 'builtin' })}
            aria-pressed={!custom}
          >
            <span className="stamp-kind__title">참 잘했어요</span>
            <span className="stamp-kind__detail">기본 도장</span>
          </button>
          <button
            type="button"
            className={`stamp-kind${custom ? ' is-on' : ''}`}
            onClick={() => (stamp.imageId ? setStamp({ kind: 'custom' }) : onUpload())}
            aria-pressed={custom}
          >
            <span className="stamp-kind__title">내 이미지</span>
            <span className="stamp-kind__detail">{stamp.imageId ? '사용할 수 있어요' : '사진으로 만들기'}</span>
          </button>
        </div>
        {stamp.imageId && (
          <button type="button" className="decor-link" onClick={onUpload}>
            <ImagePlus size={14} strokeWidth={2.4} /> 도장 이미지 바꾸기
          </button>
        )}
      </section>

      <section className="sgroup">
        <h3 className="sgroup__title">효과</h3>
        <div className="sgroup__card">
          <OptionRow title="잉크 번짐 질감" detail="끄면 깔끔한 선으로 찍혀요">
            <Toggle checked={stamp.ink} onChange={(ink) => setStamp({ ink })} label="잉크 번짐 질감" />
          </OptionRow>
          {custom && (
            <OptionRow title="한 가지 색으로 찍기" detail={stamp.tint ? '이미지 모양대로 잉크색을 입혀요' : '원본 이미지 색 그대로 찍혀요'}>
              <Toggle checked={stamp.tint} onChange={(tint) => setStamp({ tint })} label="한 가지 색으로 찍기" />
            </OptionRow>
          )}
          {coloured && (
            <OptionRow title="잉크 색">
              <div className="ink-colors" role="radiogroup" aria-label="잉크 색">
                {(Object.keys(STAMP_COLOR_LABEL) as StampColor[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={stamp.color === c}
                    aria-label={STAMP_COLOR_LABEL[c]}
                    title={STAMP_COLOR_LABEL[c]}
                    className={`ink-color${stamp.color === c ? ' is-on' : ''}`}
                    style={{ background: stampColor(c) }}
                    onClick={() => setStamp({ color: c })}
                  >
                    {stamp.color === c && <Check size={13} strokeWidth={3.4} />}
                  </button>
                ))}
              </div>
            </OptionRow>
          )}
          <OptionRow title="비스듬히 찍기" detail="손으로 찍은 것처럼 조금씩 기울어져요">
            <Toggle checked={stamp.tilt} onChange={(tilt) => setStamp({ tilt })} label="비스듬히 찍기" />
          </OptionRow>
          <OptionRow title="쿵! 찍히는 효과" detail="완료할 때 도장이 내려앉아요">
            <Toggle checked={stamp.animate} onChange={(animate) => setStamp({ animate })} label="쿵 찍히는 효과" />
          </OptionRow>
        </div>
      </section>

      <section className="sgroup">
        <h3 className="sgroup__title">찍는 곳</h3>
        <div className="sgroup__card">
          <OptionRow title="오늘의 루틴 카드" detail="끝낸 영상의 체크 자리에 찍어요">
            <Toggle checked={stamp.cards} onChange={(cards) => setStamp({ cards })} label="오늘의 루틴 카드" />
          </OptionRow>
          <OptionRow title="캘린더" detail="모두 끝낸 날에 찍어요">
            <Toggle checked={stamp.calendar} onChange={(calendar) => setStamp({ calendar })} label="캘린더" />
          </OptionRow>
        </div>
        <p className="settings__foot">오늘 운동을 모두 마치면 완료 화면에도 크게 찍혀요.</p>
      </section>
    </>
  );
}

// ── ⑤ app icon ──────────────────────────────────────────
function IconTab() {
  const url = useAppIconUrl();
  const { custom, pick, reset, openGuide, elements } = useIconFlow();

  return (
    <>
      <div className="decor-stage decor-stage--stamp">
        <IconPreview url={url} />
      </div>
      <section className="sgroup">
        <h3 className="sgroup__title">앱 아이콘</h3>
        <div className="sgroup__card">
          <button type="button" className="srow" onClick={pick}>
            <span className="srow__icon">
              <ImagePlus size={18} strokeWidth={2.3} />
            </span>
            <span className="srow__text">
              <span className="srow__title">{custom ? '사진 바꾸기' : '내 사진으로 아이콘 만들기'}</span>
              <span className="srow__detail">정사각형으로 원하는 부분만 잘라서 써요</span>
            </span>
          </button>
          {custom && (
            <button type="button" className="srow" onClick={reset}>
              <span className="srow__icon">
                <RotateCcw size={18} strokeWidth={2.3} />
              </span>
              <span className="srow__text">
                <span className="srow__title">기본 아이콘으로 되돌리기</span>
                <span className="srow__detail">모루 기본 아이콘 (mo.)</span>
              </span>
            </button>
          )}
        </div>
        <p className="settings__foot">
          새 아이콘은 홈 화면에 추가할 때 들어가요. 이미 홈 화면에 있다면 아이콘을 지우고 다시 추가해야 바뀌어요.
        </p>
        <button type="button" className="decor-link icon-tab__guide" onClick={openGuide}>
          홈 화면 아이콘 바꾸는 법
        </button>
      </section>
      {elements}
    </>
  );
}

// ── page ────────────────────────────────────────────────
export function DecorPage({ open, onClose, onArrange }: DecorPageProps) {
  const { decor, setBackground, addSticker, setStamp, resetDecor } = useDecor();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('theme');
  const [screen, setScreen] = useState<DecorScreen>('today');
  const [bgScreens, setBgScreens] = useState<DecorScreen[]>(['today']);
  const [upload, setUpload] = useState<{ purpose: ImagePurpose; file: File | null } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingPurpose = useRef<ImagePurpose>('background');
  useBackButton(open, onClose);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('is-locked');
    return () => document.body.classList.remove('is-locked');
  }, [open]);

  if (!open) return null;

  const pick = (purpose: ImagePurpose) => {
    pendingPurpose.current = purpose;
    fileRef.current?.click();
  };

  const done = (img: EditedImage) => {
    const purpose = upload?.purpose;
    setUpload(null);
    if (purpose === 'background') {
      const prev = decor.backgrounds[bgScreens[0]];
      bgScreens.forEach((s) => setBackground(s, { ...DEFAULT_BG, ...prev, imageId: img.imageId }));
    } else if (purpose === 'sticker') {
      const w = 0.32;
      const aspect = img.height / img.width;
      const n = (decor.stickers[screen] ?? []).length;
      // new stickers land near the top-right, fanned out a little
      addSticker(screen, { id: newStickerId(), imageId: img.imageId, x: 0.6 - (n % 3) * 0.08, y: 0.08 + (n % 4) * 0.12, w, aspect, rot: n % 2 ? 6 : -6 });
      toast({ message: '스티커를 붙였어요. 화면에서 위치를 바꿀 수 있어요' });
    } else if (purpose === 'stamp') {
      setStamp({ kind: 'custom', imageId: img.imageId, tint: false });
    }
  };

  const showScreenPicker = tab === 'sticker';
  const isDefault =
    decor.theme.preset === DEFAULT_THEME.preset &&
    Object.keys(decor.backgrounds).length === 0 &&
    Object.values(decor.stickers).every((l) => !l?.length) &&
    JSON.stringify(decor.stamp) === JSON.stringify(DEFAULT_STAMP) &&
    !decor.icon;

  return createPortal(
    <div className="settings-page decor-page" role="dialog" aria-modal="true" aria-labelledby="decor-title">
      <div className="settings-page__inner">
        <header className="settings-page__head">
          <h1 id="decor-title" className="screen-title">
            꾸미기
          </h1>
          <IconButton label="닫기" onClick={onClose}>
            <X size={20} strokeWidth={2.4} />
          </IconButton>
        </header>

        <div className="decor-tabs" role="tablist" aria-label="꾸미기 종류">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`decor-tab${tab === t.id ? ' is-on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showScreenPicker && (
          <div className="decor-screens">
            <span className="decor-screens__label">꾸밀 화면</span>
            <Choice wide label="꾸밀 화면" value={screen} options={DECOR_SCREENS.map((s) => ({ value: s.id, label: s.label }))} onChange={setScreen} />
          </div>
        )}

        <div className="decor-body" key={tab}>
          {tab === 'theme' && <ThemeTab />}
          {tab === 'background' && <BackgroundTab screens={bgScreens} onScreens={setBgScreens} onUpload={() => pick('background')} />}
          {tab === 'sticker' && <StickerTab screen={screen} onUpload={() => pick('sticker')} onArrange={() => onArrange(screen)} />}
          {tab === 'stamp' && <StampTab onUpload={() => pick('stamp')} />}
          {tab === 'icon' && <IconTab />}
        </div>

        {!isDefault && (
          <section className="sgroup sgroup--reset">
            <button type="button" className="decor-link decor-link--danger" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={14} strokeWidth={2.4} /> 꾸미기 전체 되돌리기
            </button>
          </section>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setUpload({ purpose: pendingPurpose.current, file: f });
          e.target.value = '';
        }}
      />
      <ImageEditor
        file={upload?.file ?? null}
        purpose={upload?.purpose ?? 'background'}
        onCancel={() => setUpload(null)}
        onDone={done}
        renderPreview={(url, aspect) =>
          upload?.purpose === 'sticker' ? (
            <StickerPreview url={url} aspect={aspect} />
          ) : upload?.purpose === 'stamp' ? (
            <StampPreview settings={{ ...decor.stamp, kind: 'custom', tint: false }} imageUrl={url} />

          ) : (
            <BackgroundPreview url={url} bg={decor.backgrounds[bgScreens[0]] ?? DEFAULT_BG} />
          )
        }
      />
      <ConfirmDialog
        open={confirmReset}
        destructive
        icon={<RotateCcw size={22} strokeWidth={2.2} />}
        title="꾸미기를 모두 되돌릴까요?"
        message="테마 색, 배경, 스티커, 도장, 앱 아이콘이 기본으로 돌아가고 올린 사진도 지워져요. 운동 기록은 그대로예요."
        confirmLabel="되돌리기"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDecor();
          setConfirmReset(false);
          toast({ message: '꾸미기를 기본으로 되돌렸어요' });
        }}
      />
    </div>,
    document.body,
  );
}
