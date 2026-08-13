const CLOUDINARY_URL_PATTERN = /^https:\/\/res\.cloudinary\.com\//;

export function isHostedImageUrl(value: unknown): boolean {
  return typeof value === "string" && CLOUDINARY_URL_PATTERN.test(value);
}

/** Returns an error message if the value is present but not an uploaded (Cloudinary-hosted) image URL. */
export function invalidImageMessage(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return isHostedImageUrl(value) ? null : `${label} must be an uploaded image, not raw image data.`;
}

/** Same check for an array of image URLs (e.g. product gallery images). */
export function invalidImageArrayMessage(values: unknown, label: string): string | null {
  if (values === undefined || values === null) return null;
  if (!Array.isArray(values)) return `${label} must be a list of uploaded images.`;
  for (const value of values) {
    const error = invalidImageMessage(value, label);
    if (error) return error;
  }
  return null;
}

/** For assets uploaded as Cloudinary "authenticated" resources (e.g. government IDs),
 * which come back as a bare public_id rather than a public URL — just confirms it went
 * through our upload endpoint instead of being raw client-submitted image data. */
export function invalidPrivateAssetMessage(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.startsWith("data:") || value.startsWith("http")) {
    return `${label} must be an uploaded image, not raw image data.`;
  }
  return null;
}
