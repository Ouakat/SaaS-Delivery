import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useEffect } from "react";
import { layoutType, sidebarType, navBarType } from "@/lib/types/ui/template";
import { useSettingsStore } from "@/lib/stores/settings/settings.store";

export type Config = {
  collapsed: boolean;
  theme: string;
  skin: "default" | "bordered";
  layout: layoutType;
  sidebar: sidebarType;
  menuHidden: boolean;
  showSearchBar: boolean;
  showSwitcher: boolean;
  topHeader: "default" | "links";
  contentWidth: "wide" | "boxed";
  navbar: navBarType;
  footer: "sticky" | "default" | "hidden";
  isRtl: boolean;
  subMenu: boolean;
  hasSubMenu: boolean;
  sidebarColor: string;
  headerColor: string;
  sidebarBgImage?: string;
  radius: number;
};
export const defaultConfig: Config = {
  collapsed: false,
  theme: "zinc",
  skin: "default",
  layout: "vertical",
  sidebar: "classic",
  menuHidden: false,
  showSearchBar: true,
  topHeader: "default",
  contentWidth: "wide",
  navbar: "sticky",
  footer: "default",
  isRtl: false,
  showSwitcher: true,
  subMenu: false,
  hasSubMenu: false,
  sidebarColor: "light",
  headerColor: "light",
  sidebarBgImage: undefined,
  radius: 0.5,
};

const configAtom = atomWithStorage<Config>("config", defaultConfig);

export function useConfig() {
  const [config, setConfig] = useAtom(configAtom);
  const { generalSettings, fetchGeneralSettings } = useSettingsStore();

  useEffect(() => {
    // Fetch general settings on mount if not already loaded
    if (!generalSettings) {
      fetchGeneralSettings();
    }
  }, [generalSettings, fetchGeneralSettings]);

  useEffect(() => {
    console.log({generalSettings});
    
    // Update sidebar color from API settings when available
    if (generalSettings?.sidebarColor && generalSettings.sidebarColor !== config.sidebarColor) {
      // Validate if it's a valid hex color format
      const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(generalSettings.sidebarColor);
//@ts-ignore
      setConfig(prev => ({
        ...prev,
        sidebarColor: isValidHex ? generalSettings.sidebarColor : defaultConfig.sidebarColor
      }));
    }
  }, [generalSettings?.sidebarColor, config.sidebarColor, setConfig]);

  return [config, setConfig] as const;
}
