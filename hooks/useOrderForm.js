import { useCallback, useMemo, useState } from "react";
import {
  addComponentToParts,
  appendTranscribedText,
  computeTotals,
  createEmptyOrderForm,
  emptyDevice,
  orderToForm,
  validateOrderForm,
} from "../utils/orderForm";
import { buildCreateOrderPayload, buildUpdateOrderPayload } from "../utils/orderPayload";

export const VOICE_FIELDS = {
  customer: "note",
  technical: "technicalNote",
};

export default function useOrderForm({ edit = false, order, demands } = {}) {
  const [form, setForm] = useState(createEmptyOrderForm);
  const [hydrated, setHydrated] = useState(!edit);
  const [collapsedDevices, setCollapsedDevices] = useState({});

  if (!hydrated && order && demands) {
    const next = orderToForm(order, demands);
    setHydrated(true);
    setForm(next);
    setCollapsedDevices(Object.fromEntries(next.devices.map((device) => [device.key, true])));
  }

  const setField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const updateDevice = useCallback((key, field, value) => {
    setForm((current) => ({
      ...current,
      devices: current.devices.map((device) => (device.key === key ? { ...device, [field]: value } : device)),
    }));
  }, []);

  const addDevice = useCallback(() => {
    const next = emptyDevice();
    setForm((current) => {
      setCollapsedDevices(
        Object.fromEntries([...current.devices.map((device) => [device.key, true]), [next.key, false]]),
      );
      return { ...current, devices: [...current.devices, next] };
    });
  }, []);

  const removeDevice = useCallback((key) => {
    setForm((current) => {
      const remaining = current.devices.filter((device) => device.key !== key);
      const devices = remaining.length ? remaining : [emptyDevice()];
      setCollapsedDevices((collapsed) => {
        const copy = { ...collapsed };
        delete copy[key];
        if (!remaining.length) copy[devices[0].key] = false;
        return copy;
      });
      return { ...current, devices };
    });
  }, []);

  const toggleDevice = useCallback((key) => {
    setCollapsedDevices((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const addPart = useCallback((component) => {
    setForm((current) => ({ ...current, parts: addComponentToParts(current.parts, component) }));
  }, []);

  const changePartQuantity = useCallback((key, delta) => {
    setForm((current) => ({
      ...current,
      parts: current.parts.map((part) =>
        part.key === key ? { ...part, quantity: Math.max(1, Number(part.quantity || 1) + delta) } : part,
      ),
    }));
  }, []);

  const removePart = useCallback((key) => {
    setForm((current) => ({ ...current, parts: current.parts.filter((part) => part.key !== key) }));
  }, []);

  const applyVoiceText = useCallback(
    (field, text, mode) => {
      const formField = VOICE_FIELDS[field];
      if (!formField) return null;
      const nextValue = mode === "replace" ? text : appendTranscribedText(form[formField], text);
      setField(formField, nextValue);
      return nextValue;
    },
    [form, setField],
  );

  const totals = useMemo(() => computeTotals(form), [form]);
  const validate = useCallback(() => validateOrderForm(form), [form]);
  const buildPayload = useCallback(
    () => (edit ? buildUpdateOrderPayload(form) : buildCreateOrderPayload(form)),
    [edit, form],
  );

  return {
    form,
    hydrated,
    collapsedDevices,
    totals,
    setField,
    updateDevice,
    addDevice,
    removeDevice,
    toggleDevice,
    addPart,
    changePartQuantity,
    removePart,
    applyVoiceText,
    validate,
    buildPayload,
  };
}
