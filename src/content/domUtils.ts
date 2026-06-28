import { MODAL_SELECTORS } from "../shared/constants";

export function findActiveNetflixModal(root: ParentNode = document): HTMLElement | null {
  for (const selector of MODAL_SELECTORS) {
    const candidates = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const visible = candidates.find(isVisibleElement);
    if (visible) return visible;
  }

  return null;
}

export function isVisibleElement(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
}

export function getTextFromSelectors(root: ParentNode, selectors: string[]): string | null {
  for (const selector of selectors) {
    const text = root.querySelector<HTMLElement>(selector)?.textContent?.trim();
    if (text) return text;
  }
  return null;
}

export function sanitizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
