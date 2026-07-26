import { eventConfig } from "../config/event";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
const eventId = (import.meta.env.VITE_EVENT_ID as string | undefined) || eventConfig.eventId;

export async function deletePhotoAsOrganizer(photoId: string, accessToken: string) {
  if (!apiBaseUrl) throw new Error("The production API is not configured.");

  const response = await fetch(
    `${apiBaseUrl}/api/admin/events/${encodeURIComponent(eventId)}/photos/${encodeURIComponent(photoId)}`,
    {
      method: "DELETE",
      headers: { authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(body?.error?.message || `Deletion failed (${response.status}).`);
  }
}

export async function deleteAllPhotosAsOrganizer(accessToken: string) {
  if (!apiBaseUrl) throw new Error("The production API is not configured.");

  const response = await fetch(
    `${apiBaseUrl}/api/admin/events/${encodeURIComponent(eventId)}/photos`,
    {
      method: "DELETE",
      headers: { authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(body?.error?.message || `Bulk deletion failed (${response.status}).`);
  }
  return response.json() as Promise<{ deleted: number }>;
}
