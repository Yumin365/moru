import { BarChart3, CalendarCheck2, Check, ChevronLeft, ImagePlus, Link2, Palette, Play, Smartphone } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import { canInstall, isStandalone, onInstallChange, promptInstall } from '../../lib/install';
import { finishOnboarding } from '../../lib/onboarding';
import { PRESETS } from '../../lib/palette';
import { useAppIconUrl, useDecor } from '../../state/Decor';
import { useBackButton } from '../../state/useBackButton';
import { useIconFlow } from '../decor/IconFlow';
import { HomeScreenGuide } from '../settings/HomeScreenGuide';
import './onboarding.css';

interface OnboardingProps {
  open: boolean;
  onClose: () => void;
  /** opens the Jiny 연동 guide on top of this page */
  onOpenJiny: () => void;
}

const STEPS = 4;

function Visual({ icon, tone = 'accent' }: { icon: ReactNode; tone?: 'accent' | 'iris' | 'dark' }) {
  return (
    <div className={`onb__visual onb__visual--${tone}`} aria-hidden="true">
      {icon}
    </div>
  );
}

/** First-run guide: welcome → colour & icon → home screen → Jiny 연동. Skippable at any step. */
export function Onboarding({ open, onClose, onOpenJiny }: OnboardingProps) {
  const { decor, setTheme } = useDecor();
  const iconUrl = useAppIconUrl();
  const icon = useIconFlow();
  const [step, setStep] = useState(0);
  const [homeGuide, setHomeGuide] = useState(false);
  const [installable, setInstallable] = useState(canInstall());
  const standalone = isStandalone();

  useBackButton(open, () => (step > 0 ? setStep((s) => s - 1) : finish()));

  useEffect(() => onInstallChange(() => setInstallable(canInstall())), []);
  useEffect(() => {
    if (!open) return;
    setStep(0);
    document.body.classList.add('is-locked');
    return () => document.body.classList.remove('is-locked');
  }, [open]);

  function finish() {
    finishOnboarding();
    onClose();
  }

  if (!open) return null;
  const last = step === STEPS - 1;

  return createPortal(
    <div className="onb" role="dialog" aria-modal="true" aria-labelledby="onb-title">
      <div className="onb__inner">
        <header className="onb__top">
          {step > 0 ? (
            <button type="button" className="onb__back" onClick={() => setStep((s) => s - 1)} aria-label="이전">
              <ChevronLeft size={20} strokeWidth={2.4} />
            </button>
          ) : (
            <span />
          )}
          {!last && (
            <button type="button" className="onb__skip" onClick={finish}>
              건너뛰기
            </button>
          )}
        </header>

        <div className="onb__body" key={step}>
          {step === 0 && (
            <>
              <Visual icon={<Play size={40} strokeWidth={0} fill="currentColor" />} tone="dark" />
              <h1 id="onb-title" className="onb__title">
                모루에 오신 걸
                <br />
                환영해요
              </h1>
              <p className="onb__text">매일 할 운동을 알아서 보여 주는 나만의 홈트 앱이에요.</p>
              <ul className="onb__points">
                <li>
                  <span className="onb__point-icon">
                    <CalendarCheck2 size={18} strokeWidth={2.3} />
                  </span>
                  <span>
                    <strong>오늘의 루틴이 자동으로</strong>
                    <small>스트레칭부터 마무리까지 순서대로 준비돼요</small>
                  </span>
                </li>
                <li>
                  <span className="onb__point-icon">
                    <Play size={16} strokeWidth={0} fill="currentColor" />
                  </span>
                  <span>
                    <strong>시작 누르고 따라 하면 끝</strong>
                    <small>영상이 끝나면 다음 영상으로 바로 넘어가요</small>
                  </span>
                </li>
                <li>
                  <span className="onb__point-icon">
                    <BarChart3 size={18} strokeWidth={2.3} />
                  </span>
                  <span>
                    <strong>캘린더와 통계로 기록</strong>
                    <small>한 날은 색으로 채워지고 연속 기록이 쌓여요</small>
                  </span>
                </li>
              </ul>
            </>
          )}

          {step === 1 && (
            <>
              <Visual icon={<Palette size={42} strokeWidth={2.1} />} />
              <h1 id="onb-title" className="onb__title">
                색과 아이콘을 골라요
              </h1>
              <p className="onb__text">홈 화면에 추가하기 전에 골라 두면 좋아요. 배경·스티커·도장은 나중에 설정 › 꾸미기에서 더 꾸밀 수 있어요.</p>
              <div className="presets onb__presets">
                {PRESETS.map((p) => {
                  const on = decor.theme.preset === p.id;
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
              <div className="onb__icon">
                <img src={iconUrl} alt="지금 앱 아이콘" className="onb__icon-img" />
                <div className="onb__icon-text">
                  <strong>앱 아이콘</strong>
                  <small>{icon.custom ? '내 사진 아이콘' : '기본 아이콘 (mo.)'}</small>
                </div>
                <div className="onb__icon-actions">
                  <button type="button" className="icg__btn" onClick={icon.pick}>
                    <ImagePlus size={15} strokeWidth={2.4} /> 내 사진으로
                  </button>
                  {icon.custom && (
                    <button type="button" className="onb__icon-reset" onClick={icon.reset}>
                      기본으로
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <Visual icon={<Smartphone size={42} strokeWidth={2} />} />
              <h1 id="onb-title" className="onb__title">
                홈 화면에 추가해 두세요
              </h1>
              <p className="onb__text">
                앱처럼 아이콘을 눌러 바로 열 수 있고, 주소창 없이 화면을 넓게 써요. 인터넷이 약할 때도 잘 열려요.
              </p>
              <div className="onb__actions">
                {standalone ? (
                  <p className="onb__done">
                    <Check size={18} strokeWidth={3} /> 이미 홈 화면 앱으로 쓰고 있어요
                  </p>
                ) : (
                  <>
                    {installable && (
                      <Button variant="primary" size="lg" block onClick={() => void promptInstall()}>
                        지금 설치하기
                      </Button>
                    )}
                    <Button variant={installable ? 'ghost' : 'dark'} size="lg" block onClick={() => setHomeGuide(true)}>
                      추가하는 방법 보기
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Visual icon={<Link2 size={42} strokeWidth={2.2} />} tone="iris" />
              <h1 id="onb-title" className="onb__title">
                지니다이어트 루틴을
                <br />
                연동해 보세요
              </h1>
              <p className="onb__text">
                이지은 다이어트 홈페이지의 이번 달 루틴을 한 번에 가져와서 날짜마다 넣어 줘요. 처음 한 번만 설정하면 돼요.
              </p>
              <div className="onb__actions">
                <Button variant="dark" size="lg" block onClick={onOpenJiny}>
                  연동하는 법 보기
                </Button>
                <p className="onb__note">지금 안 해도 괜찮아요. 나중에 설정에서도 할 수 있어요.</p>
              </div>
            </>
          )}

        </div>

        <footer className="onb__foot">
          <div className="onb__dots" aria-label={`${STEPS}단계 중 ${step + 1}단계`}>
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className={`onb__dot${i === step ? ' is-on' : ''}`} />
            ))}
          </div>
          <Button variant="primary" size="lg" block onClick={() => (last ? finish() : setStep((s) => s + 1))}>
            {last ? '시작하기' : step === 0 ? '좋아요' : '다음'}
          </Button>
        </footer>
      </div>

      <HomeScreenGuide open={homeGuide} onClose={() => setHomeGuide(false)} />
      {icon.elements}
    </div>,
    document.body,
  );
}
