import { apiClient } from "../providers/api";

class AnnouncementService {
  async list({ page = 0, size = 10, type } = {}) {
    const response = await apiClient.get("/announcements", {
      params: {
        page,
        size,
        ...(type ? { type } : {}),
      },
    });
    return response.data ?? { announcements: [], totalElements: 0, totalPages: 0, page, size };
  }

  async getLatest() {
    const response = await apiClient.get("/announcements/latest");
    return response.data;
  }

  async create({ title, description, type, imageUpload }) {
    const response = await apiClient.post("/announcements", {
      title,
      description,
      type,
      imageUpload: imageUpload ?? null,
    });
    return response.data;
  }

  async update(announcementId, { title, content, type, imageUpload, removeImage }) {
    const response = await apiClient.put(`/announcements/${announcementId}`, {
      title,
      content,
      type,
      imageUpload: imageUpload ?? null,
      removeImage,
    });
    return response.data;
  }

  async remove(announcementId) {
    await apiClient.delete(`/announcements/${announcementId}`);
  }
}

export const announcementService = new AnnouncementService();
