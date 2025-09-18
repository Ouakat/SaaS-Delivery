import { BaseApiClient, ApiResponse } from "../base.client";
import type { GeneralSettings } from "@/lib/types/settings/general.types";

export class SettingsApiClient extends BaseApiClient {
  constructor() {
    super("settings"); // Point to your settings microservice
  }

  async getGeneralSettings(): Promise<ApiResponse<GeneralSettings>> {
    return this.get<GeneralSettings>("/api/general-settings");
  }

  async updateGeneralSettings(
    data: Partial<GeneralSettings>
  ): Promise<ApiResponse<GeneralSettings>> {
    return this.patch<GeneralSettings>("/api/general-settings", data);
  }

  async uploadLogo(file: File): Promise<ApiResponse<{ logoUrl: string }>> {
    const formData = new FormData();
    formData.append("logo", file);
    return this.post("/api/general-settings/upload-logo", formData);
  }

  // Add other methods...
}

export const settingsApiClient = new SettingsApiClient();
