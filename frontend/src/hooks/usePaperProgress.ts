import { useEffect, useRef, useState } from 'react';
import apiClient from '@/utils/api';

export function usePaperProgress(paperId: string | null, enabled = true) {
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!paperId || !enabled) return;

    let cancelled = false;

    const fetchProgress = async () => {
      try {
        const res = await apiClient.get(`/papers/${paperId}/progress`);
        if (cancelled || !isMounted.current) return;
        const data = res.data?.data;
        setProgress(data?.analysisProgress ?? 0);
        setMessage(data?.analysisMessage ?? '');
        setIsAnalyzing(data?.status === 'analyzing');
      } catch (err) {
        // ignore transient errors
      }
    };

    // initial fetch + polling
    fetchProgress();
    const id = window.setInterval(fetchProgress, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [paperId, enabled]);

  return { progress, message, isAnalyzing };
}
