export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Uploads a base64 data URL to Cloudinary via /api/upload. Passes through unchanged if it's already a hosted URL (e.g. unedited existing image). */
export async function uploadIfNew(value: string | null | undefined, folder: string): Promise<string | null> {
  if (!value) return null;
  if (!value.startsWith("data:")) return value;

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: value, folder }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Image upload failed.");
  return data.url;
}
