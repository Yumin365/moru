import { Copy, Download, Plus } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { ImageEditor } from '../../components/ImageEditor';
import { AndroidIcon, AppleIcon } from '../../components/PlatformIcons';
import { Sheet } from '../../components/Sheet';
import { isStandalone } from '../../lib/install';
import { appBaseUrl } from '../../lib/jiny';
import { useDecor } from '../../state/Decor';
import { useToast } from '../../state/Toast';
import { useBackupFile } from '../../state/useBackupFile';
import { detectPlatform, HomeScreenGuide, type Platform } from '../settings/HomeScreenGuide';
import { IconPreview } from './previews';

interface Step {
  title: string;
  text: ReactNode;
  action?: ReactNode;
}

/** Home-screen icons are copied when the app is added, so changing one means removing and re-adding it. */
export function IconChangeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const { download } = useBackupFile();
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  const [homeGuide, setHomeGuide] = useState(false);
  const url = appBaseUrl();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ message: '모루 주소를 복사했어요' });
    } catch {
      toast({ message: url });
    }
  };

  const backupBtn = (
    <button type="button" className="icg__btn" onClick={() => void download()}>
      <Download size={15} strokeWidth={2.4} /> 백업 내보내기
    </button>
  );
  const copyBtn = (
    <button type="button" className="icg__btn" onClick={() => void copy()}>
      <Copy size={15} strokeWidth={2.4} /> 주소 복사
    </button>
  );
  const addBtn = (
    <button type="button" className="icg__btn" onClick={() => setHomeGuide(true)}>
      <Plus size={15} strokeWidth={2.6} /> 홈 화면에 추가하는 방법
    </button>
  );

  const steps: Step[] =
    platform === 'android'
      ? [
          { title: '백업 저장해 두기', text: '혹시 모르니 기록을 파일로 먼저 저장해요.', action: backupBtn },
          {
            title: '홈 화면의 모루 아이콘 지우기',
            text: (
              <>
                아이콘을 길게 누르고 <b>삭제</b>(또는 <b>제거</b>)를 눌러요. 기록은 크롬에 남아 있어요.
              </>
            ),
          },
          { title: '크롬에서 모루 열기', text: '주소를 크롬에서 열면 새 아이콘이 이미 들어가 있어요.', action: copyBtn },
          { title: '다시 홈 화면에 추가', text: '이제 홈 화면에 새 아이콘으로 생겨요.', action: addBtn },
        ]
      : [
          {
            title: '백업 저장해 두기',
            text: (
              <>
                아이폰은 홈 화면 앱을 지우면 <b>그 안의 기록도 같이 지워져요.</b> 꼭 먼저 저장해요.
              </>
            ),
            action: backupBtn,
          },
          {
            title: '사파리에서 모루 열고 백업 가져오기',
            text: (
              <>
                주소를 사파리에서 열고 <b>설정 → 백업 가져오기</b>로 방금 저장한 파일을 넣어요. 그래야 사파리에도 새 아이콘이 들어가요.
              </>
            ),
            action: copyBtn,
          },
          { title: '홈 화면의 모루 아이콘 지우기', text: '아이콘을 길게 누르고 삭제해요.' },
          { title: '사파리에서 홈 화면에 추가', text: '이제 홈 화면에 새 아이콘으로 생겨요.', action: addBtn },
          {
            title: '새 모루 앱에서 기록 확인',
            text: (
              <>
                기록이 비어 있으면 <b>설정 → 백업 가져오기</b>로 한 번 더 넣어 주세요.
              </>
            ),
          },
        ];

  return (
    <>
      <Sheet open={open} onClose={onClose} tall eyebrow="앱 아이콘" title="홈 화면 아이콘 바꾸는 법">
        <p className="icg__lead">
          홈 화면 아이콘은 <b>추가할 때 한 번 복사돼서</b> 앱에서 바로 바꿀 수 없어요. 아래 순서대로 한 번만 다시 추가하면 새 아이콘이 돼요.
        </p>
        <div className="seg seg--wide icg__tabs" role="radiogroup" aria-label="기기">
          {(
            [
              ['android', '안드로이드', <AndroidIcon key="a" />],
              ['ios', '아이폰', <AppleIcon key="i" />],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={platform === id}
              className={`seg__opt${platform === id ? ' is-on' : ''}`}
              onClick={() => setPlatform(id)}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <ol className="icg__steps">
          {steps.map((s, i) => (
            <li key={s.title} className="icg__step">
              <span className="icg__num num">{i + 1}</span>
              <div className="icg__body">
                <strong>{s.title}</strong>
                <p>{s.text}</p>
                {s.action}
              </div>
            </li>
          ))}
        </ol>
      </Sheet>
      <HomeScreenGuide open={homeGuide} onClose={() => setHomeGuide(false)} />
    </>
  );
}

/**
 * Picking a custom app icon: file → 1:1 crop editor → saved. When the app is already
 * on the home screen, the guide for re-adding it opens right after.
 */
export function useIconFlow() {
  const { decor, setIcon } = useDecor();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [guide, setGuide] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const changed = (message: string) => {
    toast({ message });
    if (isStandalone()) setGuide(true);
  };

  const elements = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setFile(f);
          e.target.value = '';
        }}
      />
      <ImageEditor
        file={file}
        purpose="icon"
        onCancel={() => setFile(null)}
        onDone={(img) => {
          setFile(null);
          setIcon(img.imageId);
          changed('앱 아이콘을 바꿨어요');
        }}
        renderPreview={(url) => <IconPreview url={url} />}
      />
      <IconChangeGuide open={guide} onClose={() => setGuide(false)} />
    </>
  );

  return {
    custom: !!decor.icon,
    pick: () => inputRef.current?.click(),
    reset: () => {
      setIcon(null);
      changed('기본 아이콘으로 되돌렸어요');
    },
    openGuide: () => setGuide(true),
    elements,
  };
}
