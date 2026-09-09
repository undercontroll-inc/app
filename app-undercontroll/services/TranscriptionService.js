import { apiClient } from "../providers/api";

class TranscriptionService {
  async transcribe(file) {
    const form = new FormData();
    form.append("audio", file);
    const response = await apiClient.post("/transcriptions", form, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }
}

export const transcriptionService = new TranscriptionService();
