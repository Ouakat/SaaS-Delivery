"use client";
import React from "react";
import { cn } from "@/lib/utils/ui.utils";
import { Label } from "@/components/ui/label";
import { useConfig } from "@/hooks/use-config";
import { Icon } from "@/components/ui/icon";
import { Check } from "lucide-react";
import { defaultSidebarColorSvg, colorSidebarColorSvg } from "./data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
const SidebarColor = () => {
  const [config, setConfig] = useConfig();
  const { theme } = useTheme();
  const isHexColor = config.sidebarColor?.startsWith('#');
  const isDarkMode = theme === 'dark';
  const [show, setShow] = React.useState<boolean>(
    config.sidebarColor !== "light"
  );

  // Get the display color (adjusted for dark mode if needed)
  const displayColor = isHexColor
    ? adjustHexColorForDarkMode(config.sidebarColor, isDarkMode)
    : config.sidebarColor;

  return (
    <div className="p-6 -mx-6">
      <div className="text-muted-foreground font-normal text-xs mb-4 uppercase">
        Sidebar Color
      </div>
      <div className=" grid grid-cols-3 gap-3 mb-4">
        <div>
          <button
            type="button"
            onClick={() => {
              setConfig({ ...config, sidebarColor: "light" });
              setShow(false);
            }}
            disabled={config.sidebarColor === "light"}
            className={cn(
              " border  block  border-default-300 rounded relative h-[72px] w-full disabled:cursor-not-allowed duration-150 overflow-hidden cursor-pointer",
              {
                "text-default  border-default-700 dark:border-default-600":
                  config.sidebarColor === "light",
                "text-muted-foreground ": config.sidebarColor !== "light",
              }
            )}
          >
            <Icon
              icon="heroicons:check-circle-20-solid"
              className={cn(
                "text-default absolute top-1 right-1 duration-100 scale-0",
                {
                  " scale-100": config.sidebarColor === "light",
                }
              )}
            />
            {defaultSidebarColorSvg}
          </button>
          <Label className=" text-muted-foreground font-normal block mt-2.5">
            Default
          </Label>
        </div>
        <div>
          <button
            type="button"
            onClick={() => {
              setShow(true);
              setConfig({ ...config, sidebarColor: "dark" });
            }}
            disabled={show}
            className={cn(
              " border  block  border-default-300 rounded relative h-[72px] w-full disabled:cursor-not-allowed duration-150 overflow-hidden cursor-pointer",
              {
                "text-default  border-default": show,
                "text-muted-foreground ": !show,
              }
            )}
          >
            <Icon
              icon="heroicons:check-circle-20-solid"
              className={cn(
                "text-default absolute top-1 right-1 duration-100 scale-0",
                {
                  " scale-100": show,
                }
              )}
            />
            {colorSidebarColorSvg}
          </button>
          <Label className=" text-muted-foreground font-normal block mt-2.5">
            color
          </Label>
        </div>
      </div>

      {show && (
        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap bg-default-200 p-3 rounded-md">
            {[
              "dark",
              "rose",
              "steel-blue",
              "purple",
              "redwood",
              "green",
              "ocean-blue",
              "gray",
            ].map((color) => (
              <div key={color}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig({ ...config, sidebarColor: color })
                        }
                        disabled={config.sidebarColor === color && !isHexColor}
                        className={cn(
                          " border    border-default-300  inline-flex justify-center rounded-md items-center relative h-8 w-8  disabled:cursor-not-allowed duration-150 cursor-pointer",
                          {
                            "bg-default": color === "dark",
                            "bg-[#343A40]": color === "gray",
                            "bg-[#B52755]": color === "rose",
                            "bg-[#405189]": color === "steel-blue",
                            "bg-[#4A154B]": color === "purple",
                            "bg-[#5D3942]": color === "redwood",
                            "bg-[#135846]": color === "green",
                            "bg-[#0766AD]": color === "ocean-blue",
                          }
                        )}
                      >
                        <Check
                          className={cn(
                            " text-white h-4 w-4  duration-100 scale-0",
                            {
                              " scale-100": config.sidebarColor === color && !isHexColor,
                            }
                          )}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{color}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>

          {isHexColor && (
            <div className="bg-default-200 p-3 rounded-md">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-default-300"
                  style={{ backgroundColor: displayColor }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Custom Color: {config.sidebarColor}</span>
                  {isDarkMode && (
                    <span className="text-xs text-muted-foreground">Dark mode: {displayColor}</span>
                  )}
                </div>
                <Check className="text-green-500 h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarColor;
