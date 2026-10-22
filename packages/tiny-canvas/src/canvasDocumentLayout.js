const STORAGE_PREFIX = 'tiny-canvas:canvas-document-layout:v1:';

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const validCoordinate = (value) => Number.isFinite(value);
const validDimension = (value) => Number.isFinite(value) && value > 0;

export function canvasDocumentLayoutKey(documentId) {
  return `${STORAGE_PREFIX}${encodeURIComponent(documentId)}`;
}

export function normalizeGeometry(value) {
  if (
    !isRecord(value) ||
    !isRecord(value.position) ||
    !validCoordinate(value.position.x) ||
    !validCoordinate(value.position.y) ||
    !validDimension(value.width) ||
    !validDimension(value.height)
  ) {
    return null;
  }

  return {
    x: value.position.x,
    y: value.position.y,
    width: value.width,
    height: value.height,
  };
}

export function geometryBasis(geometry) {
  return geometry ? { ...geometry } : null;
}

export function geometryMatchesBasis(current, basis) {
  return Boolean(
    current &&
      basis &&
      current.x === basis.x &&
      current.y === basis.y &&
      current.width === basis.width &&
      current.height === basis.height
  );
}

export function resolveDocumentGeometry(current, override) {
  if (!geometryMatchesBasis(current, override?.basis)) {
    return current;
  }
  return normalizeGeometry({
    position: { x: override.geometry?.x, y: override.geometry?.y },
    width: override.geometry?.width,
    height: override.geometry?.height,
  }) || current;
}

export function updateDocumentGeometry(overrides, itemId, basis, geometry) {
  if (!basis || !geometry) return overrides;
  const nextGeometry = {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
  };
  if (
    !validCoordinate(nextGeometry.x) ||
    !validCoordinate(nextGeometry.y) ||
    !validDimension(nextGeometry.width) ||
    !validDimension(nextGeometry.height)
  ) {
    return overrides;
  }

  return {
    ...overrides,
    [itemId]: {
      basis: geometryBasis(basis),
      geometry: nextGeometry,
    },
  };
}

export function readDocumentGeometry(storage, documentId) {
  try {
    const serialized = storage?.getItem(canvasDocumentLayoutKey(documentId));
    if (!serialized) return {};
    const parsed = JSON.parse(serialized);
    if (parsed?.version !== 1 || !isRecord(parsed.items)) return {};

    return Object.fromEntries(
      Object.entries(parsed.items).flatMap(([itemId, item]) => {
        const basis = isRecord(item) ? item.basis : null;
        const geometry = isRecord(item) ? item.geometry : null;
        const normalizedBasis = normalizeGeometry({
          position: { x: basis?.x, y: basis?.y },
          width: basis?.width,
          height: basis?.height,
        });
        const normalizedGeometry = normalizeGeometry({
          position: { x: geometry?.x, y: geometry?.y },
          width: geometry?.width,
          height: geometry?.height,
        });
        return normalizedBasis && normalizedGeometry
          ? [[itemId, { basis: normalizedBasis, geometry: normalizedGeometry }]]
          : [];
      })
    );
  } catch {
    return {};
  }
}

export function writeDocumentGeometry(storage, documentId, items) {
  try {
    storage?.setItem(
      canvasDocumentLayoutKey(documentId),
      JSON.stringify({ version: 1, items })
    );
    return true;
  } catch {
    return false;
  }
}

export function resetDocumentGeometry(storage, documentId) {
  try {
    storage?.removeItem(canvasDocumentLayoutKey(documentId));
    return true;
  } catch {
    return false;
  }
}
