import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

export default function useRefreshOnFocus(refetch) {
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
