import { CircleCheck, Info, Trash2, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button, IconButton } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MonthHeader } from '../../components/MonthHeader';
import { Sheet } from '../../components/Sheet';
import { Thumbnail } from '../../components/Thumbnail';
import { addMonths, daysInMonth, formatMonthTitle, formatParts } from '../../lib/date';
import {
  appBaseUrl,
  buildBookmarklet,
  buildScheduleDays,
  guessMonth,
  mapToMonth,
  parseJinyPayload,
  uniqueVideoIds,
  type JinyPayload,
} from '../../lib/jiny';
import { fetchVideoTitle, parseYouTubeId, watchUrl } from '../../lib/youtube';
import { useToast } from '../../state/Toast';
import { useStore } from '../../state/WorkoutStore';
import { JinyGuide } from './JinyGuide';
import './import.css';

interface JinyImportSheetProps {
  open: boolean;
  /** Data handed over by the bookmarklet (via the URL hash), if any */
  payload: JinyPayload | null;
  onClose: () => void;
}

const FALLBACK_NAME = '지니다이어트 루틴';

function monthLabel(month: string) {
  const t = formatMonthTitle(month);
  return `${t.year}년 ${t.month}`;
}

export function JinyImportSheet({ open, payload: incoming, onClose }: JinyImportSheetProps) {
  const { todayKey, imported, saveImportedMonth, removeImportedMonth, videoNames, setVideoNames, customDatesIn } = useStore();
  const toast = useToast();
  const [payload, setPayload] = useState<JinyPayload | null>(incoming);
  const [month, setMonth] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});
  const [ytTitles, setYtTitles] = useState<Record<string, string | null>>({});
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState(false);
  const [removeMonth, setRemoveMonth] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPayload(incoming);
    setPasted('');
    setPasteError(false);
  }, [open, incoming]);

  useEffect(() => {
    if (payload) setMonth(guessMonth(payload, todayKey));
  }, [payload, todayKey]);

  const mapping = useMemo(() => (payload && month ? mapToMonth(payload, month) : null), [payload, month]);
  const videos = useMemo(() => (mapping ? uniqueVideoIds(mapping) : []), [mapping]);
  const videoKey = videos.map((v) => v.id).join(',');

  // Fetch YouTube titles once per video (free oEmbed); saved names win.
  useEffect(() => {
    if (!videoKey) return;
    const ctrl = new AbortController();
    const ids = videoKey.split(',');
    ids.forEach((id) => {
      if (id in ytTitles) return;
      void fetchVideoTitle(id, ctrl.signal).then((title) => {
        if (ctrl.signal.aborted) return;
        setYtTitles((prev) => ({ ...prev, [id]: title }));
      });
    });
    setNames((prev) => {
      const next = { ...prev };
      for (const id of ids) if (next[id] === undefined && videoNames[id]) next[id] = videoNames[id];
      return next;
    });
    return () => ctrl.abort();
  }, [videoKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const finalName = (id: string) => names[id]?.trim() || videoNames[id] || ytTitles[id] || FALLBACK_NAME;

  const apply = () => {
    if (!mapping) return;
    const chosen: Record<string, string> = {};
    for (const v of videos) chosen[v.id] = finalName(v.id);
    setVideoNames(chosen);
    saveImportedMonth(mapping.month, buildScheduleDays(mapping, (id) => chosen[id] ?? FALLBACK_NAME));
    toast({ message: `${monthLabel(mapping.month)} 지니 루틴을 가져왔어요` });
    setPayload(null);
    onClose();
  };

  const copyBookmarklet = async () => {
    const code = buildBookmarklet(appBaseUrl());
    try {
      await navigator.clipboard.writeText(code);
      toast({ message: '북마크 코드를 복사했어요' });
    } catch {
      window.prompt('아래 코드를 모두 복사하세요', code);
    }
  };

  const loadPasted = () => {
    const p = parseJinyPayload(pasted);
    setPasteError(!p);
    if (p) setPayload(p);
  };

  const importedMonths = Object.keys(imported).sort().reverse();
  const daysWithVideos = mapping ? Object.keys(mapping.days).length : 0;
  const videoCount = mapping ? Object.values(mapping.days).reduce((n, l) => n + l.length, 0) : 0;
  const customDays = mapping ? customDatesIn(mapping.month).length : 0;

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        tall
        eyebrow="지니다이어트 연동"
        title={payload ? '지니 루틴 가져오기' : '루틴 가져오는 법'}
        footer={
          payload && mapping ? (
            <div className="editor-footer">
              <Button variant="ghost" onClick={() => setPayload(null)}>
                취소
              </Button>
              <Button variant="dark" size="lg" className="editor-footer__save" onClick={apply} disabled={daysWithVideos === 0}>
                {formatMonthTitle(mapping.month).month} 루틴 적용하기
              </Button>
            </div>
          ) : undefined
        }
      >
        {payload && mapping ? (
          <div className="jiny">
            <MonthHeader
              year={formatMonthTitle(month).year}
              month={formatMonthTitle(month).month}
              suffix="루틴"
              onPrev={() => setMonth((m) => addMonths(m, -1))}
              onNext={() => setMonth((m) => addMonths(m, 1))}
            />

            <div className="jiny__stats">
              <span>
                <strong className="num">{daysWithVideos}</strong>일
              </span>
              <span>
                영상 <strong className="num">{videoCount}</strong>개
              </span>
              <span>
                영상 종류 <strong className="num">{videos.length}</strong>개
              </span>
            </div>

            {mapping.outside > 0 ? (
              <div className="jiny__note is-warn">
                <TriangleAlert size={16} strokeWidth={2.4} />
                <span>
                  영상 {mapping.outside}개의 날짜를 찾지 못했어요. 위에서 달이 맞는지 확인해 주세요.
                </span>
              </div>
            ) : (
              <div className="jiny__note is-ok">
                <CircleCheck size={16} strokeWidth={2.4} />
                <span>모든 영상의 날짜를 찾았어요. 영상이 없는 날은 휴식일이 돼요.</span>
              </div>
            )}
            {imported[mapping.month] && (
              <div className="jiny__note">
                <Info size={16} strokeWidth={2.4} />
                <span>전에 가져온 {formatMonthTitle(mapping.month).month} 루틴을 새로 덮어써요.</span>
              </div>
            )}
            {customDays > 0 && (
              <div className="jiny__note">
                <Info size={16} strokeWidth={2.4} />
                <span>직접 편집한 {customDays}일은 편집한 내용이 그대로 유지돼요.</span>
              </div>
            )}

            <h3 className="jiny__title">영상 이름</h3>
            <p className="editor-intro">달력에 적힌 짧은 이름으로 바꿔두면 다음 달에도 그대로 써요.</p>
            <ul className="jiny__videos">
              {videos.map((v) => (
                <li key={v.id} className="jiny__video">
                  <Thumbnail url={watchUrl(v.id)} type="workout" className="jiny__thumb" />
                  <div className="jiny__video-body">
                    <input
                      className="input"
                      value={names[v.id] ?? videoNames[v.id] ?? ytTitles[v.id] ?? ''}
                      placeholder={v.id in ytTitles ? (ytTitles[v.id] ?? FALLBACK_NAME) : '제목 불러오는 중…'}
                      onChange={(e) => setNames((prev) => ({ ...prev, [v.id]: e.target.value }))}
                      aria-label="영상 이름"
                    />
                    <span className="jiny__video-meta">
                      {v.days}일 · {ytTitles[v.id] && finalName(v.id) !== ytTitles[v.id] ? ytTitles[v.id] : 'YouTube'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <h3 className="jiny__title">일정 미리보기</h3>
            <ol className="jiny__days">
              {daysInMonth(mapping.month).map((key) => {
                const links = mapping.days[key] ?? [];
                const p = formatParts(key);
                return (
                  <li key={key} className={links.length ? '' : 'is-rest'}>
                    <span className="jiny__day num">
                      {p.day}
                      <small>{p.weekdayShort}</small>
                    </span>
                    <span className="jiny__day-text">
                      {links.length
                        ? links.map((href) => finalName(parseYouTubeId(href) ?? '')).join('  +  ')
                        : '휴식'}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <div className="jiny">
            <p className="editor-intro">
              지니다이어트 [이달의 루틴] 달력을 이 앱 일정으로 가져와요. 처음 한 번 북마크를 만들어 두면, 다음부터는 매달 10초면 끝나요.
              로그인 정보는 앱에 저장되지 않아요.
            </p>
            <JinyGuide resetKey={open} onCopyBookmarklet={copyBookmarklet} />

            {importedMonths.length > 0 && (
              <>
                <h3 className="jiny__title">가져온 루틴</h3>
                <ul className="jiny__imported">
                  {importedMonths.map((m) => (
                    <li key={m}>
                      <span>
                        <strong>{monthLabel(m)}</strong>
                        <small>
                          {new Date(imported[m].importedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}에
                          가져옴
                        </small>
                      </span>
                      <IconButton label={`${monthLabel(m)} 가져온 루틴 삭제`} variant="plain" size={40} onClick={() => setRemoveMonth(m)}>
                        <Trash2 size={17} strokeWidth={2.3} />
                      </IconButton>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <details className="jiny__paste">
              <summary>북마크가 앱을 못 열 때: 직접 붙여넣기</summary>
              <textarea
                className="input jiny__textarea"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="복사한 가져오기 데이터를 붙여넣으세요"
                rows={3}
              />
              {pasteError && <p className="field__hint is-error">가져오기 데이터가 아니에요.</p>}
              <Button variant="soft" size="sm" onClick={loadPasted} disabled={!pasted.trim()}>
                불러오기
              </Button>
            </details>
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={removeMonth !== null}
        destructive
        icon={<Trash2 size={22} strokeWidth={2.2} />}
        title="가져온 루틴을 삭제할까요?"
        message={removeMonth ? `${monthLabel(removeMonth)}은 다시 기본 일정 파일의 내용으로 돌아가요. 운동 기록은 그대로예요.` : undefined}
        confirmLabel="삭제"
        onCancel={() => setRemoveMonth(null)}
        onConfirm={() => {
          if (removeMonth) removeImportedMonth(removeMonth);
          setRemoveMonth(null);
          toast({ message: '가져온 루틴을 삭제했어요' });
        }}
      />
    </>
  );
}
