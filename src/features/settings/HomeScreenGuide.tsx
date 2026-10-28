import { Copy, Download, House, PlusSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Guide, type GuideStep } from '../../components/guide/Guide';
import { ChromeBar, Device, Hl, Lines, SafariBar } from '../../components/guide/mock';
import { AndroidIcon, AppleIcon } from '../../components/PlatformIcons';
import { Sheet } from '../../components/Sheet';
import { canInstall, isStandalone, promptInstall } from '../../lib/install';
import { appBaseUrl } from '../../lib/jiny';
import { useAppIconUrl } from '../../state/Decor';
import { useToast } from '../../state/Toast';

interface HomeScreenGuideProps {
  open: boolean;
  onClose: () => void;
}

export type Platform = 'android' | 'ios';

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadOS ? 'ios' : 'android';
}

function HomeScreen({ tap }: { tap?: number }) {
  const iconUrl = useAppIconUrl();
  return (
    <Device>
      <div className="mk-home">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="mk-home__app">
            <i />
            앱
          </span>
        ))}
        <span className="mk-home__app">
          <Hl n={tap}>
            <span className="mk-appicon">
              <img src={iconUrl} alt="" />
            </span>
          </Hl>
          모루
        </span>
      </div>
    </Device>
  );
}

/** "홈 화면에 추가하는 방법" — illustrated steps for Chrome (Galaxy Tab) and Safari (iPad/iPhone). */
export function HomeScreenGuide({ open, onClose }: HomeScreenGuideProps) {
  const toast = useToast();
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  const iconUrl = useAppIconUrl();
  const host = appBaseUrl().replace(/^https?:\/\//, '');
  useEffect(() => {
    if (open) setPlatform(detectPlatform());
  }, [open]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appBaseUrl());
      toast({ message: '앱 주소를 복사했어요' });
    } catch {
      window.prompt('아래 주소를 복사하세요', appBaseUrl());
    }
  };

  const openStep: GuideStep = {
    title: platform === 'ios' ? 'Safari에서 앱 주소 열기' : '크롬에서 앱 주소 열기',
    body: (
      <>
        {platform === 'ios' ? <b>Safari</b> : <b>크롬(Chrome)</b>}에서 이 앱 주소를 열어요. 지금 이 화면을 보고 있다면 이미
        열려 있는 거예요.
        <span className="guide__note">{platform === 'ios' ? '아이폰은 꼭 Safari로 열어야 해요.' : '삼성 인터넷보다 크롬을 추천해요.'}</span>
      </>
    ),
    art: <Device>{platform === 'ios' ? <SafariBar url={host} /> : <ChromeBar url={host} />}<div className="mk-page"><Lines n={5} /></div></Device>,
    action: (
      <Button variant="soft" icon={<Copy size={16} strokeWidth={2.4} />} onClick={copyUrl}>
        앱 주소 복사
      </Button>
    ),
  };

  const android: GuideStep[] = [
    openStep,
    {
      title: '오른쪽 위 ⋮ 메뉴 누르기',
      body: (
        <>
          주소창 오른쪽 끝의 <b>점 세 개(⋮)</b>를 눌러요.
        </>
      ),
      art: (
        <Device>
          <ChromeBar url={host} menu="hl" />
          <div className="mk-page">
            <Lines n={5} />
          </div>
        </Device>
      ),
    },
    {
      title: '‘설치 및 바로가기 만들기’ 누르기',
      body: (
        <>
          메뉴를 아래로 내려서 <b>설치 및 바로가기 만들기</b>를 눌러요.
          <span className="guide__note">예전 크롬은 ‘홈 화면에 추가’ 또는 ‘앱 설치’로 보여요. 모두 같은 기능이에요.</span>
        </>
      ),
      art: (
        <Device>
          <ChromeBar url={host} />
          <div className="mk-page">
            <Lines n={5} />
          </div>
          <div className="mk-menu">
            <div className="mk-menu__row">새 탭</div>
            <div className="mk-menu__row">방문 기록</div>
            <div className="mk-menu__row">다운로드</div>
            <Hl>
              <span className="mk-menu__row">
                <PlusSquare size={12} strokeWidth={2.4} /> 설치 및 바로가기 만들기
              </span>
            </Hl>
            <div className="mk-menu__row">설정</div>
          </div>
        </Device>
      ),
    },
    {
      title: '‘설치’ 누르기',
      body: (
        <>
          창이 뜨면 <b>설치</b>를 눌러요.
          <span className="guide__note">‘설치’와 ‘바로가기 만들기’ 중 고르라고 나오면 <b>설치</b>를 골라요. 주소창 없이 앱처럼 열려요.</span>
        </>
      ),
      art: (
        <Device>
          <ChromeBar url={host} />
          <div className="mk-page">
            <Lines n={5} />
          </div>
          <div className="mk-dialog">
            <div className="mk-dialog__box">
              <h4>앱 설치</h4>
              <div className="mk-dialog__app">
                <span className="mk-appicon">
                  <img src={iconUrl} alt="" />
                </span>
                <span>
                  <b>모루</b>
                  <br />
                  <small style={{ color: '#6e6e74' }}>{host.split('/')[0]}</small>
                </span>
              </div>
              <div className="mk-dialog__actions">
                <span style={{ color: '#5f6368' }}>취소</span>
                <Hl>
                  <span style={{ padding: '1px 4px' }}>설치</span>
                </Hl>
              </div>
            </div>
          </div>
        </Device>
      ),
    },
    {
      title: '홈 화면의 모루로 열기',
      body: (
        <>
          이제 홈 화면에 <b>모루</b> 아이콘이 생겨요. 다음부터는 이 아이콘을 누르면 주소창 없이 앱처럼 열려요.
          <span className="guide__note">운동 기록은 그대로 이어져요.</span>
        </>
      ),
      art: <HomeScreen />,
    },
  ];

  const ios: GuideStep[] = [
    openStep,
    {
      title: '공유 버튼 누르기',
      body: (
        <>
          화면 아래(또는 위)의 <b>공유 버튼(네모에 위쪽 화살표)</b>을 눌러요.
        </>
      ),
      art: (
        <Device>
          <SafariBar url={host} share="hl" />
          <div className="mk-page">
            <Lines n={5} />
          </div>
        </Device>
      ),
    },
    {
      title: '‘홈 화면에 추가’ 누르기',
      body: (
        <>
          아래로 내려서 <b>홈 화면에 추가</b>를 눌러요.
        </>
      ),
      art: (
        <Device>
          <SafariBar url={host} />
          <div className="mk-page">
            <Lines n={3} />
          </div>
          <div className="mk-sheet">
            <div className="mk-sheet__row">복사</div>
            <div className="mk-sheet__row">읽기 목록에 추가</div>
            <Hl>
              <span className="mk-sheet__row">
                홈 화면에 추가 <PlusSquare size={12} strokeWidth={2.4} />
              </span>
            </Hl>
          </div>
        </Device>
      ),
    },
    {
      title: '오른쪽 위 ‘추가’ 누르기',
      body: (
        <>
          이름이 <b>모루</b>인지 확인하고 오른쪽 위 <b>추가</b>를 눌러요.
        </>
      ),
      art: (
        <Device>
          <div className="mk-form">
            <div className="mk-form__head">
              <span style={{ color: '#007aff' }}>취소</span>
              <span>홈 화면에 추가</span>
              <Hl>
                <span style={{ color: '#007aff', padding: '0 4px' }}>추가</span>
              </Hl>
            </div>
            <div className="mk-dialog__app" style={{ marginTop: 8 }}>
              <span className="mk-appicon">
                <img src={iconUrl} alt="" />
              </span>
              <span className="mk-field" style={{ flex: 1 }}>
                <span style={{ borderColor: '#c7c7cc' }}>모루</span>
              </span>
            </div>
          </div>
        </Device>
      ),
    },
    {
      title: '홈 화면의 모루로 열기',
      body: (
        <>
          홈 화면에 생긴 <b>모루</b> 아이콘을 누르면 주소창 없이 앱처럼 열려요.
        </>
      ),
      art: <HomeScreen />,
    },
  ];

  const standalone = isStandalone();

  return (
    <Sheet open={open} onClose={onClose} tall eyebrow="앱처럼 쓰기" title="홈 화면에 추가하는 방법">
      <div className="jiny">
        {standalone ? (
          <div className="jiny__note is-ok" style={{ marginTop: 0, marginBottom: 14 }}>
            <House size={16} strokeWidth={2.4} />
            <span>이미 홈 화면 앱으로 쓰고 있어요. 다른 기기에 설치할 때 아래 방법을 보세요.</span>
          </div>
        ) : (
          canInstall() && (
            <div className="install-now">
              <span>이 기기에서는 버튼 하나로 바로 설치할 수 있어요.</span>
              <Button variant="primary" icon={<Download size={16} strokeWidth={2.4} />} onClick={() => void promptInstall()}>
                지금 바로 설치
              </Button>
            </div>
          )
        )}

        <div className="seg seg--wide" role="radiogroup" aria-label="기기 종류">
          {(
            [
              ['android', '안드로이드', <AndroidIcon key="a" />],
              ['ios', '아이폰', <AppleIcon key="i" />],
            ] as const
          ).map(([value, label, icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={platform === value}
              className={`seg__opt${platform === value ? ' is-on' : ''}`}
              onClick={() => setPlatform(value)}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <Guide steps={platform === 'ios' ? ios : android} resetKey={`${open}-${platform}`} onFinish={onClose} finishLabel="다 했어요" />
        </div>
      </div>
    </Sheet>
  );
}
