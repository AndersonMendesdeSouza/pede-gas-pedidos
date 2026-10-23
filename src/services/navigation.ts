import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
const getRoute = () => window.location.hash.replace(/^#\/?/, "") || "inicio";
export function useRoute() {
  return useSyncExternalStore(subscribe, getRoute);
}
export function navigate(route: string) {
  window.location.hash = `/${route}`;
}
