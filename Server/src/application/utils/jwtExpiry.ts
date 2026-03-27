const parseJwtExpiresIn = (expiresIn: string): number => {
  const trimmed = expiresIn.trim().toLowerCase();

  // jsonwebtoken supports:
  // - number (seconds)
  // - "1d", "12h", "30m", "45s"
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
    return asNumber * 1000;
  }

  const match = trimmed.match(/^(\d+)\s*(ms|s|m|h|d)$/);
  if (!match) {
    // Fallback to 1 day.
    return 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
};

export const computeJwtExpiresAt = (): Date => {
  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";
  return new Date(Date.now() + parseJwtExpiresIn(expiresIn));
};

