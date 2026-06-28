import { META_SELECTORS, TITLE_SELECTORS } from "../shared/constants";
import type { ParsedTitle, TitleType } from "../shared/types";
import { getTextFromSelectors, sanitizeText } from "./domUtils";

const YEAR_PATTERN = /\b(19|20)\d{2}\b/;

export function createCanonicalKey(title: string, year?: string, type: TitleType = "unknown"): string {
  const normalizedTitle = sanitizeText(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return [normalizedTitle, year || "unknown", type || "unknown"].join(":");
}

export function parseNetflixModal(modal: HTMLElement): ParsedTitle | null {
  const rawTitle = getTextFromSelectors(modal, TITLE_SELECTORS) ?? inferTitleFromAria(modal);
  const title = rawTitle ? cleanTitle(rawTitle) : null;
  if (!title) return null;

  const metadataText = collectMetadataText(modal);
  const year = metadataText.match(YEAR_PATTERN)?.[0];
  const type = inferType(metadataText);
  const netflixId = inferNetflixId(modal);

  return {
    title,
    year,
    type,
    netflixId,
    canonicalKey: createCanonicalKey(title, year, type)
  };
}

function cleanTitle(rawTitle: string): string {
  return sanitizeText(rawTitle)
    .replace(/^Watch\s+/i, "")
    .replace(/\s+\|\s+Netflix.*$/i, "")
    .trim();
}

function collectMetadataText(modal: HTMLElement): string {
  const selectorText = META_SELECTORS
    .map((selector) => Array.from(modal.querySelectorAll<HTMLElement>(selector)).map((node) => node.textContent ?? "").join(" "))
    .join(" ");
  return sanitizeText(`${selectorText} ${modal.textContent ?? ""}`);
}

function inferType(metadataText: string): TitleType {
  if (/\b(season|seasons|episodes|limited series|series)\b/i.test(metadataText)) return "series";
  if (/\b(movie|film|runtime|minutes|min)\b/i.test(metadataText)) return "movie";
  return "unknown";
}

function inferNetflixId(modal: HTMLElement): string | undefined {
  const idSource = modal.querySelector<HTMLAnchorElement>('a[href*="/watch/"], a[href*="/title/"]')?.href ?? modal.innerHTML;
  return idSource.match(/(?:watch|title)\/(\d+)/)?.[1];
}

function inferTitleFromAria(modal: HTMLElement): string | null {
  const aria = modal.getAttribute("aria-label") ?? modal.getAttribute("aria-labelledby");
  if (!aria) return null;

  if (aria.startsWith("previewModal")) {
    const labelled = document.getElementById(aria);
    return labelled?.textContent?.trim() ?? null;
  }

  return aria;
}
