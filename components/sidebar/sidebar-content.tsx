"use client";
import React from "react";
import { cn } from "@/lib/utils/ui.utils";
import { useConfig } from "@/hooks/use-config";
import { useMenuHoverConfig } from "@/hooks/use-menu-hover";
import { useTheme } from "next-themes";

// Utility function to adjust hex color for dark mode
const adjustHexColorForDarkMode = (hexColor: string, isDark: boolean): string => {
  if (!isDark) return hexColor;

  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Darken the color by reducing brightness (multiply by 0.7 for dark mode)
  const darkR = Math.round(r * 0.7);
  const darkG = Math.round(g * 0.7);
  const darkB = Math.round(b * 0.7);

  // Convert back to hex
  const darkHex = `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;

  return darkHex;
};

const SidebarContent = ({ children }: { children: React.ReactNode }) => {
  const [config] = useConfig();
  const [hoverConfig, setHoverConfig] = useMenuHoverConfig();
  const { theme } = useTheme();

  // Check if sidebarColor is a hex color
  const isHexColor = config.sidebarColor?.startsWith('#');
  const isDarkMode = theme === 'dark';

  // Get the appropriate color for current theme
  const sidebarBackgroundColor = isHexColor
    ? adjustHexColorForDarkMode(config.sidebarColor, isDarkMode)
    : undefined;

  if (config.menuHidden || config.layout === "horizontal") return null;

  if (config.sidebar === "two-column") {
    return (
      <aside className={cn("fixed z-50 h-full xl:flex hidden", {})}>
        <div className=" relative flex h-full ">{children}</div>
      </aside>
    );
  }

  return (
    <aside
      onMouseEnter={() =>
        config.sidebar === "classic" && setHoverConfig({ hovered: true })
      }
      onMouseLeave={() =>
        config.sidebar === "classic" && setHoverConfig({ hovered: false })
      }
      className={cn(
        "fixed z-50 w-[248px] bg-sidebar shadow-base xl:block hidden ",
        {
          [`dark theme-${config.sidebarColor}`]:
            config.sidebarColor !== "light" && !isHexColor,
          "dark": config.sidebarColor !== "light" && isHexColor,
          "w-[72px]": config.collapsed && config.sidebar !== "compact",
          "border-b": config.skin === "bordered",
          "shadow-base": config.skin === "default",
          "h-full start-0":
            config.layout !== "semi-box" && config.layout !== "compact",
          "m-6 bottom-0 top-0  start-0   rounded-md":
            config.layout === "semi-box",
          "m-10 bottom-0 top-0  start-0   ": config.layout === "compact",
          "w-28": config.sidebar === "compact",
          "w-[248px]": hoverConfig.hovered,
        }
      )}
      style={sidebarBackgroundColor ? { backgroundColor: sidebarBackgroundColor } : undefined}
    >
      <div className=" relative  flex flex-col h-full  ">
        {config.sidebarBgImage !== undefined && (
          <div
            className=" absolute left-0 top-0   z-[-1] w-full h-full bg-cover bg-center opacity-[0.07]"
            style={{ backgroundImage: `url(${config.sidebarBgImage})` }}
          ></div>
        )}
        {children}
      </div>
    </aside>
  );
};

export default SidebarContent;
