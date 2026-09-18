"use client";

import { useCallback, useEffect, useState } from "react";
import { loadLearnerProgress, type LearnerProgress } from "./client";

const progressUpdatedEvent = "sinyal:learner-progress-updated";

export type LearnerProgressState =
  | { status: "loading"; progress: null }
  | { status: "ready"; progress: LearnerProgress }
  | { status: "error"; progress: null };

export function notifyLearnerProgressUpdated() {
  window.dispatchEvent(new Event(progressUpdatedEvent));
}

export function useLearnerProgress() {
  const [state, setState] = useState<LearnerProgressState>({ status: "loading", progress: null });
  const reload = useCallback(async () => {
    setState({ status: "loading", progress: null });
    try {
      setState({ status: "ready", progress: await loadLearnerProgress() });
    } catch {
      setState({ status: "error", progress: null });
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadLearnerProgress().then((progress) => {
      if (active) setState({ status: "ready", progress });
    }).catch(() => {
      if (active) setState({ status: "error", progress: null });
    });
    const refresh = () => { void reload(); };
    window.addEventListener(progressUpdatedEvent, refresh);
    return () => {
      active = false;
      window.removeEventListener(progressUpdatedEvent, refresh);
    };
  }, [reload]);

  return { ...state, reload };
}
