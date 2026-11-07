import { useSyncExternalStore } from "react";

let current = null;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setVoiceSheet(next) {
  current = next;
  emit();
}

export function clearVoiceSheet(owner) {
  if (current && current.owner === owner) {
    current = null;
    emit();
  }
}

export function getVoiceSheet() {
  return current;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useVoiceSheet() {
  return useSyncExternalStore(subscribe, getVoiceSheet, getVoiceSheet);
}
