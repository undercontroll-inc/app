import { createContext, useContext, useMemo, useState } from "react";

const TabBarVisibilityContext = createContext({
  hidden: false,
  setHidden: () => {},
});

export function TabBarVisibilityProvider({ children }) {
  const [hidden, setHidden] = useState(false);
  const value = useMemo(() => ({ hidden, setHidden }), [hidden]);

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  return useContext(TabBarVisibilityContext);
}
