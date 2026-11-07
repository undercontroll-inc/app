import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { dtoToDraft, ITEM_ACTION, newManualItem, reconcileManualIds } from "../utils/stockImport";

const StockImportDraftContext = createContext(null);

export function StockImportDraftProvider({ children }) {
  const [drafts, setDrafts] = useState({});

  const updateDraft = useCallback((importId, updater) => {
    const key = String(importId);
    setDrafts((current) => {
      if (!current[key]) return current;
      return { ...current, [key]: updater(current[key]) };
    });
  }, []);

  const seedDraft = useCallback((dto, { force = false } = {}) => {
    const key = String(dto.id);
    setDrafts((current) => (current[key] && !force ? current : { ...current, [key]: dtoToDraft(dto) }));
  }, []);

  const clearDraft = useCallback((importId) => {
    const key = String(importId);
    setDrafts((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ drafts, updateDraft, seedDraft, clearDraft }),
    [drafts, updateDraft, seedDraft, clearDraft],
  );

  return <StockImportDraftContext.Provider value={value}>{children}</StockImportDraftContext.Provider>;
}

export function useStockImportDraft(importId) {
  const context = useContext(StockImportDraftContext);
  if (!context) throw new Error("useStockImportDraft must be used inside StockImportDraftProvider");
  const { drafts, updateDraft, seedDraft, clearDraft } = context;
  const draft = drafts[String(importId)] ?? null;

  const updateItem = useCallback(
    (itemKey, patch) =>
      updateDraft(importId, (current) => ({
        ...current,
        items: current.items.map((item) => (item.key === itemKey ? { ...item, ...patch } : item)),
      })),
    [importId, updateDraft],
  );

  const addItem = useCallback(() => {
    const item = newManualItem();
    updateDraft(importId, (current) => ({ ...current, items: [...current.items, item] }));
    return item;
  }, [importId, updateDraft]);

  const removeItem = useCallback(
    (itemKey) =>
      updateDraft(importId, (current) => ({
        ...current,
        items: current.items.filter((item) => item.key !== itemKey),
      })),
    [importId, updateDraft],
  );

  const toggleIgnore = useCallback(
    (itemKey) =>
      updateDraft(importId, (current) => ({
        ...current,
        items: current.items.map((item) => {
          if (item.key !== itemKey) return item;
          if (item.action !== ITEM_ACTION.IGNORE)
            return { ...item, previousAction: item.action, action: ITEM_ACTION.IGNORE };
          const restored = item.previousAction ?? (item.componentId != null ? ITEM_ACTION.ADD : ITEM_ACTION.CREATE);
          return { ...item, action: restored };
        }),
      })),
    [importId, updateDraft],
  );

  const setItemErrors = useCallback(
    (errorsByIndex) =>
      updateDraft(importId, (current) => ({
        ...current,
        items: current.items.map((item, index) => ({ ...item, serverError: errorsByIndex[index] ?? null })),
      })),
    [importId, updateDraft],
  );

  const reconcile = useCallback(
    (dto) => updateDraft(importId, (current) => reconcileManualIds(current, dto)),
    [importId, updateDraft],
  );

  const clear = useCallback(() => clearDraft(importId), [clearDraft, importId]);

  return {
    draft,
    reconcile,
    seed: seedDraft,
    clear,
    updateItem,
    addItem,
    removeItem,
    toggleIgnore,
    setItemErrors,
  };
}
