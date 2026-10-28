import { useDecor } from './Decor';
import { useToast } from './Toast';
import { useStore } from './WorkoutStore';

/** Saving / restoring the full backup file (records + 꾸미기 with its pictures). */
export function useBackupFile() {
  const { todayKey, exportBackup, importBackup, markBackedUp } = useStore();
  const { exportDecor, importDecor } = useDecor();
  const toast = useToast();

  const download = async () => {
    // 꾸미기 (incl. uploaded pictures) travels in the same file
    const decorBackup = await exportDecor().catch(() => null);
    const blob = new Blob([JSON.stringify({ ...exportBackup(), decor: decorBackup }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moru-backup-${todayKey}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    markBackedUp();
    toast({ message: '백업 파일을 저장했어요' });
  };

  const restore = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const ok = importBackup(data);
      if (ok && data.decor) await importDecor(data.decor.decor, data.decor.images).catch(() => false);
      toast({ message: ok ? '백업을 복원했어요' : '모루 백업 파일이 아니에요' });
    } catch {
      toast({ message: '파일을 읽을 수 없어요' });
    }
  };

  return { download, restore };
}
