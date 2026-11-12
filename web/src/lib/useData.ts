import { useEffect, useRef, useState } from 'react';

// Charge une donnée asynchrone, et la recharge quand `key` change.
export function useData<T>(key: string, load: () => Promise<T>) {
  const [state, setState] = useState<{ key?: string; data?: T; error?: Error }>(
    {},
  );
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let active = true;
    loadRef
      .current()
      .then((data) => active && setState({ key, data }))
      .catch((error: Error) => active && setState({ key, error }));
    return () => {
      active = false;
    };
  }, [key]);

  const fresh = state.key === key;
  return {
    data: fresh ? state.data : undefined,
    error: fresh ? state.error : undefined,
    loading: !fresh,
  };
}
