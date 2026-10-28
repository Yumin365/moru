import { Check, ClipboardCopy, ExternalLink, Monitor, Smartphone, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { Guide, type GuideStep } from '../../components/guide/Guide';
import {
  BookmarkChip,
  BookmarkRow,
  ChromeBar,
  DesktopWindow,
  Device,
  Hl,
  Lines,
  MockButton,
  SearchRow,
} from '../../components/guide/mock';
import { appBaseUrl, buildBookmarklet, JINY_ROUTINE_URL } from '../../lib/jiny';
import { useToast } from '../../state/Toast';

type Platform = 'tablet' | 'pc';

const detectPlatform = (): Platform =>
  window.matchMedia?.('(any-pointer: coarse)').matches ? 'tablet' : 'pc';

/**
 * The real bookmarklet as a link you can drag onto the bookmarks bar (desktop).
 * The javascript: href is set on the DOM directly — React refuses javascript: URLs as props.
 */
function DraggableBookmarklet({ label }: { label: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const toast = useToast();
  useEffect(() => {
    ref.current?.setAttribute('href', buildBookmarklet(appBaseUrl()));
  }, []);
  return (
    <a
      ref={ref}
      className="bm-drag"
      draggable
      onClick={(e) => {
        e.preventDefault();
        toast({ message: '누르지 말고, 위쪽 북마크바로 끌어다 놓으세요' });
      }}
    >
      <Star size={16} strokeWidth={2.6} /> {label}
    </a>
  );
}

interface JinyGuideProps {
  resetKey?: unknown;
  onCopyBookmarklet: () => void;
}

const BOOKMARK_NAME = '지니가져오기';

/** "루틴 가져오는 법" — illustrated, one step per screen (tablet/phone or PC). */
export function JinyGuide({ resetKey, onCopyBookmarklet }: JinyGuideProps) {
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  useEffect(() => setPlatform(detectPlatform()), [resetKey]);

  const applyStep: GuideStep = {
    tag: '매달',
    title: '앱에서 적용하기',
    body: (
      <>
        이 앱이 자동으로 열리면서 그달 루틴이 보여요. 영상 이름을 확인하고 <b>적용하기</b>를 누르면 끝이에요.
        <span className="guide__note">영상 이름을 달력에 적힌 짧은 이름으로 바꿔두면 다음 달에도 그대로 써요.</span>
      </>
    ),
    art: (
      <Device>
        <div className="mk-page">
          <div className="mk-title" style={{ textAlign: 'center' }}>
            10월 루틴
          </div>
          <div style={{ textAlign: 'center', color: '#6e6e74', fontSize: 10, marginBottom: 10 }}>31일 · 영상 52개</div>
          <Lines n={5} />
          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
            <Hl>
              <MockButton>10월 루틴 적용하기</MockButton>
            </Hl>
          </div>
        </div>
      </Device>
    ),
  };

  const calendar = (cells: number) => (
    <div className="mk-cal">
      {Array.from({ length: cells }, (_, i) => (
        <span key={i} className={i < 3 ? '' : 'is-video'} />
      ))}
    </div>
  );

  const openRoutineAction = (
    <a className="btn btn--soft btn--md" href={JINY_ROUTINE_URL} target="_blank" rel="noreferrer">
      <span className="btn__icon">
        <ExternalLink size={16} strokeWidth={2.4} />
      </span>
      <span className="btn__label">이달의 루틴 페이지 열기</span>
    </a>
  );

  const pcSteps: GuideStep[] = [
    {
      tag: '처음 한 번만',
      title: '북마크바 켜기',
      body: (
        <>
          주소창 바로 아래에 <b>북마크바</b>가 보이는지 확인해요. 안 보이면 키보드에서 <b>Ctrl + Shift + B</b>를 눌러요.
          <span className="guide__note">맥은 ⌘ + Shift + B 예요.</span>
        </>
      ),
      art: (
        <DesktopWindow url="앱 주소" barHl>
          <Lines n={4} />
        </DesktopWindow>
      ),
    },
    {
      tag: '처음 한 번만',
      title: '버튼을 북마크바로 끌어다 놓기',
      body: (
        <>
          아래 <b>⭐ {BOOKMARK_NAME}</b> 버튼을 마우스로 꾹 눌러서, 위쪽 <b>북마크바</b>까지 끌어다 놓아요. 그러면 북마크가
          완성돼요.
          <span className="guide__note">
            끌어다 놓기가 안 되면: 북마크바 빈 곳을 <b>오른쪽 클릭 → ‘페이지 추가’</b> → 이름은 {BOOKMARK_NAME}, URL에는{' '}
            <b>코드 복사</b>로 복사한 코드를 붙여넣어요. (☆ 별 버튼으로 만든 북마크는 주소를 바꿀 수 없어요.)
          </span>
        </>
      ),
      art: (
        <DesktopWindow url="앱 주소" bar={<BookmarkChip label={BOOKMARK_NAME} hl />}>
          <Lines n={3} />
          <span className="mk-drag">
            <Star size={10} strokeWidth={2.6} /> {BOOKMARK_NAME}
          </span>
        </DesktopWindow>
      ),
      action: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <DraggableBookmarklet label={BOOKMARK_NAME} />
          <Button variant="soft" size="sm" icon={<ClipboardCopy size={15} strokeWidth={2.4} />} onClick={onCopyBookmarklet}>
            코드 복사
          </Button>
        </div>
      ),
    },
    {
      tag: '매달',
      title: '이달의 루틴 페이지 열기',
      body: (
        <>
          지니다이어트에 <b>로그인한 상태</b>로 [이달의 루틴] 페이지를 열고, 아래로 내려서 <b>달력이 보일 때까지</b> 기다려요.
        </>
      ),
      art: (
        <DesktopWindow url="jinydiet.com/routine" bar={<BookmarkChip label={BOOKMARK_NAME} />}>
          <div className="mk-nav">
            <b>이달의 루틴</b>
            <span>루틴스터디</span>
            <span>루틴플러스</span>
          </div>
          {calendar(21)}
        </DesktopWindow>
      ),
      action: openRoutineAction,
    },
    {
      tag: '매달',
      title: '북마크바의 ‘' + BOOKMARK_NAME + '’ 누르기',
      body: (
        <>
          루틴 달력이 보이는 상태에서 북마크바의 <b>⭐ {BOOKMARK_NAME}</b>를 한 번 눌러요.
        </>
      ),
      art: (
        <DesktopWindow url="jinydiet.com/routine" bar={<BookmarkChip label={BOOKMARK_NAME} hl />}>
          {calendar(21)}
        </DesktopWindow>
      ),
    },
    applyStep,
  ];

  const tabletSteps: GuideStep[] = [
    {
      tag: '처음 한 번만',
      title: '북마크 코드 복사하기',
      body: (
        <>
          아래 <b>북마크 코드 복사</b> 버튼을 눌러요. 루틴을 가져오는 데 쓰는 짧은 코드가 복사돼요.
        </>
      ),
      art: (
        <Device>
          <div className="mk-page">
            <div className="mk-title">루틴 가져오는 법</div>
            <Lines n={2} />
            <div style={{ marginTop: 14 }}>
              <Hl>
                <MockButton>
                  <ClipboardCopy size={11} strokeWidth={2.6} /> 북마크 코드 복사
                </MockButton>
              </Hl>
            </div>
            <div style={{ marginTop: 16 }}>
              <Lines n={3} />
            </div>
          </div>
        </Device>
      ),
      action: (
        <Button variant="dark" icon={<ClipboardCopy size={16} strokeWidth={2.4} />} onClick={onCopyBookmarklet}>
          북마크 코드 복사
        </Button>
      ),
    },
    {
      tag: '처음 한 번만',
      title: '크롬에서 북마크 추가하기',
      body: (
        <>
          크롬에서 아무 페이지나 열고, 주소창 오른쪽의 <b>☆ 별</b>을 눌러요. 아래에 &lsquo;북마크를 추가했습니다&rsquo;가 뜨면{' '}
          <b>수정</b>을 눌러요.
          <span className="guide__note">주소창에 ☆가 없으면 오른쪽 위 ⋮ 메뉴 맨 윗줄에 있어요.</span>
        </>
      ),
      art: (
        <Device>
          <ChromeBar url="www.google.com" star="hl" starTap={1} />
          <div className="mk-page">
            <Lines n={4} />
          </div>
          <div className="mk-snack">
            북마크를 추가했습니다
            <Hl n={2}>
              <span className="mk-snack__action">수정</span>
            </Hl>
          </div>
        </Device>
      ),
    },
    {
      tag: '처음 한 번만',
      title: '이름과 주소 바꾸기',
      body: (
        <>
          <b>이름</b>을 지우고 <b>{BOOKMARK_NAME}</b>라고 적어요. <b>URL</b> 칸의 주소는 전부 지우고, 1단계에서 복사한 코드를{' '}
          <b>붙여넣기</b> 해요. 그다음 뒤로 가면 저장돼요.
          <span className="guide__note">코드는 javascript: 로 시작해요. 처음부터 끝까지 전부 붙여넣어야 해요. 컴퓨터는 이 화면이 달라서 위쪽 ‘컴퓨터’ 안내를 보세요.</span>
        </>
      ),
      art: (
        <Device>
          <div className="mk-form">
            <div className="mk-form__head">
              <span>← 북마크 수정</span>
              <Check size={14} strokeWidth={2.8} />
            </div>
            <div className="mk-field">
              <small>이름</small>
              <Hl n={1}>
                <span>{BOOKMARK_NAME}</span>
              </Hl>
            </div>
            <div className="mk-field">
              <small>URL</small>
              <Hl n={2}>
                <span>javascript:(function()&#123;var APP=…</span>
              </Hl>
            </div>
            <div className="mk-field">
              <small>폴더</small>
              <span style={{ borderColor: '#dadce0', color: '#5f6368' }}>모바일 북마크</span>
            </div>
          </div>
        </Device>
      ),
    },
    {
      tag: '매달',
      title: '이달의 루틴 페이지 열기',
      body: (
        <>
          지니다이어트에 <b>로그인한 상태</b>로 [이달의 루틴] 페이지를 열고, 아래로 내려서 <b>달력이 보일 때까지</b> 기다려요.
          <span className="guide__note">로그인은 한 번 해두면 계속 유지돼요.</span>
        </>
      ),
      art: (
        <Device>
          <ChromeBar url="jinydiet.com/routine" />
          <div className="mk-page">
            <div className="mk-nav">
              <b>이달의 루틴</b>
              <span>루틴스터디</span>
              <span>루틴플러스</span>
            </div>
            <div className="mk-cal">
              {Array.from({ length: 28 }, (_, i) => (
                <span key={i} className={i < 3 ? '' : 'is-video'} />
              ))}
            </div>
          </div>
        </Device>
      ),
      action: (
        <a className="btn btn--soft btn--md" href={JINY_ROUTINE_URL} target="_blank" rel="noreferrer">
          <span className="btn__icon">
            <ExternalLink size={16} strokeWidth={2.4} />
          </span>
          <span className="btn__label">이달의 루틴 페이지 열기</span>
        </a>
      ),
    },
    {
      tag: '매달',
      title: `주소창에 ‘${BOOKMARK_NAME}’ 입력하기`,
      body: (
        <>
          루틴 페이지에서 주소창을 누르고 <b>{BOOKMARK_NAME}</b>를 입력해요. 목록에 뜨는 <b>☆ 북마크 항목</b>을 눌러요.
          <span className="guide__note">아래쪽의 🔍 검색 항목을 누르면 안 돼요. 꼭 별 모양 북마크 항목을 눌러요.</span>
        </>
      ),
      art: (
        <Device>
          <ChromeBar url="" typed={BOOKMARK_NAME} />
          <div className="mk-suggest">
            <BookmarkRow title={BOOKMARK_NAME} sub="javascript:(function(){var APP=…" hl />
            <SearchRow text={BOOKMARK_NAME} />
          </div>
        </Device>
      ),
    },
    applyStep,
  ];

  return (
    <>
      <div className="seg seg--wide" role="radiogroup" aria-label="기기 종류" style={{ marginBottom: 14 }}>
        {(
          [
            ['tablet', '모바일', <Smartphone key="m" size={16} strokeWidth={2.4} />],
            ['pc', '컴퓨터', <Monitor key="c" size={16} strokeWidth={2.4} />],
          ] as const
        ).map(([value, label, icon]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={platform === value}
            className={'seg__opt' + (platform === value ? ' is-on' : '')}
            onClick={() => setPlatform(value)}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
      <Guide steps={platform === 'pc' ? pcSteps : tabletSteps} resetKey={String(resetKey) + '-' + platform} />
    </>
  );
}
