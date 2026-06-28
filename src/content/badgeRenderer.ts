import type { RatingsResult } from "../shared/types";

const OVERLAY_SELECTOR = '[data-netflix-ratings-overlay="true"]';

export function hasRatingBadges(modal: HTMLElement): boolean {
  return Boolean(modal.querySelector(OVERLAY_SELECTOR));
}

export function renderRatingBadges(modal: HTMLElement, ratings: RatingsResult | null): HTMLElement {
  const existing = modal.querySelector<HTMLElement>(OVERLAY_SELECTOR);
  const container = existing ?? document.createElement("div");
  container.dataset.netflixRatingsOverlay = "true";
  container.className = "nro-rating-row";
  container.replaceChildren(...createBadgeNodes(ratings));

  if (!existing) {
    findInsertionTarget(modal).append(container);
  }

  return container;
}

function createBadgeNodes(ratings: RatingsResult | null): HTMLElement[] {
  if (!ratings || (!ratings.imdb && !ratings.rottenTomatoes && !ratings.metacritic)) {
    return [createErrorBadge()];
  }

  return [
    ratings.imdb ? createBadge("IMDb", ratings.imdb.score, "nro-imdb", ratings.imdb.votes) : null,
    ratings.rottenTomatoes
      ? createBadge("Rotten Tomatoes", ratings.rottenTomatoes.score, "nro-rt", ratings.rottenTomatoes.audienceScore ? `Audience ${ratings.rottenTomatoes.audienceScore}` : undefined)
      : null,
    ratings.metacritic ? createBadge("Metacritic", ratings.metacritic.score, "nro-metacritic") : null
  ].filter((node): node is HTMLElement => Boolean(node));
}

function createBadge(label: string, score: string, className: string, meta?: string): HTMLElement {
  const badge = document.createElement("div");
  badge.className = `nro-badge ${className}`;

  const labelNode = document.createElement("span");
  labelNode.className = "nro-label";
  labelNode.textContent = label;

  const scoreNode = document.createElement("span");
  scoreNode.className = "nro-score";
  scoreNode.textContent = score;

  badge.append(labelNode, scoreNode);

  if (meta) {
    const metaNode = document.createElement("span");
    metaNode.className = "nro-meta";
    metaNode.textContent = meta;
    badge.append(metaNode);
  }

  return badge;
}

function createErrorBadge(): HTMLElement {
  const badge = document.createElement("div");
  badge.className = "nro-badge nro-error";
  badge.textContent = "Ratings unavailable";
  return badge;
}

function findInsertionTarget(modal: HTMLElement): HTMLElement {
  return (
    modal.querySelector<HTMLElement>('[data-uia="previewModal-tags"], .previewModal--tags, .videoMetadata--container, .title-info-metadata-wrapper') ??
    modal.querySelector<HTMLElement>(".previewModal--detailsMetadata-left, .detail-modal-container, .jawBoneContainer") ??
    modal
  );
}
