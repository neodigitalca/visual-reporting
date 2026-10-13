export type EntityGeneratorSubmode = "locations" | "competitors";

export const ENTITY_GENERATOR_SUBMODE_STORAGE_KEY = "neo-pulse-entity-generator-submode";

export function readStoredEntitySubmode(): EntityGeneratorSubmode {
  try {
    const v = sessionStorage.getItem(ENTITY_GENERATOR_SUBMODE_STORAGE_KEY);
    if (v === "locations" || v === "competitors") return v;
  } catch {
    /* ignore */
  }
  return "locations";
}

export function writeStoredEntitySubmode(mode: EntityGeneratorSubmode): void {
  try {
    sessionStorage.setItem(ENTITY_GENERATOR_SUBMODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
