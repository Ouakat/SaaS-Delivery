"use client";

import React from "react";
import { Ellipsis, LogOut } from "lucide-react";
import { usePathname } from "@/components/navigation";
import { cn } from "@/lib/utils/ui.utils";
import { getMenuList } from "@/lib/constants/menus";
import { useMenuPermissions } from "@/lib/utils/menu-permissions";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useConfig } from "@/hooks/use-config";
import MenuLabel from "../common/menu-label";
import MenuItem from "../common/menu-item";
import { CollapseMenuButton } from "../common/collapse-menu-button";
import MenuWidget from "../common/menu-widget";
import SearchBar from "@/components/sidebar/common/search-bar";
import TeamSwitcher from "../common/team-switcher";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { getLangDir } from "rtl-detect";
import Logo from "@/components/logo";
import SidebarHoverToggle from "@/components/sidebar/sidebar-hover-toggle";
import { useMenuHoverConfig } from "@/hooks/use-menu-hover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuthStore } from "@/lib/stores/auth.store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";

export function MenuClassic({}) {
  // translate
  const t = useTranslations("Menu");
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const direction = getLangDir(params?.locale ?? "");

  const isDesktop = useMediaQuery("(min-width: 1280px)");

  // Get menu permissions
  const { filterMenuList } = useMenuPermissions();
  const { user, isAuthenticated } = useAuthStore();

  // Get raw menu list and filter by permissions
  const rawMenuList = getMenuList(pathname, t);
  const filteredMenuList = isAuthenticated ? filterMenuList(rawMenuList) : [];

  const [config, setConfig] = useConfig();
  const collapsed = config.collapsed;
  const [hoverConfig] = useMenuHoverConfig();
  const { hovered } = hoverConfig;

  const scrollableNodeRef = React.useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (
        scrollableNodeRef.current &&
        scrollableNodeRef.current.scrollTop > 0
      ) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
    scrollableNodeRef.current?.addEventListener("scroll", handleScroll);
  }, [scrollableNodeRef]);

  // Show loading state if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  // Show message if no menu items are accessible
  if (filteredMenuList.length === 0) {
    return (
      <>
        {isDesktop && (
          <div className="flex items-center justify-between px-4 py-4">
            <Logo />
            <SidebarHoverToggle />
          </div>
        )}
        <ScrollArea className="[&>div>div[style]]:block!" dir={direction}>
          {isDesktop && (
            <div
              className={cn("space-y-3 mt-6", {
                "px-4": !collapsed || hovered,
                "text-center": collapsed || !hovered,
              })}
            >
              <TeamSwitcher />
              <SearchBar />
            </div>
          )}

          <nav className="mt-8 h-full w-full px-4">
            <Alert color="warning" variant="soft">
              <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Limited Access</div>
                  <div className="text-sm">
                    You don't have permission to access any menu items. Please
                    contact your administrator.
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    User type: {user?.userType || "Unknown"}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {!collapsed && (
              <div className="w-full grow flex items-end mt-8">
                <MenuWidget />
              </div>
            )}
          </nav>
        </ScrollArea>
      </>
    );
  }

  return (
    <>
      {isDesktop && (
        <div className="flex items-center justify-between px-4 py-4">
          <Logo />
          <SidebarHoverToggle />
        </div>
      )}

      <ScrollArea className="[&>div>div[style]]:block!" dir={direction}>
        {isDesktop && (
          <div
            className={cn("space-y-3 mt-6", {
              "px-4": !collapsed || hovered,
              "text-center": collapsed || !hovered,
            })}
          >
            <TeamSwitcher />
            <SearchBar />
          </div>
        )}

        <nav className="mt-8 h-full w-full">
          <ul className="h-full flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-4">
            {filteredMenuList?.map(({ groupLabel, menus }, index) => (
              <li className={cn("w-full", groupLabel ? "" : "")} key={index}>
                {((!collapsed || hovered) && groupLabel) ||
                !collapsed === undefined ? (
                  <MenuLabel label={groupLabel} />
                ) : collapsed &&
                  !hovered &&
                  !collapsed !== undefined &&
                  groupLabel ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger className="w-full">
                        <div className="w-full flex justify-center items-center">
                          <Ellipsis className="h-5 w-5 text-default-700" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{groupLabel}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}

                {menus.map(
                  ({ href, label, icon, active, id, submenus }, index) =>
                    submenus.length === 0 ? (
                      <div className="w-full mb-2 last:mb-0" key={index}>
                        <TooltipProvider disableHoverableContent>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <div>
                                <MenuItem
                                  label={label}
                                  icon={icon}
                                  href={href}
                                  active={active}
                                  id={id}
                                  collapsed={collapsed}
                                />
                              </div>
                            </TooltipTrigger>
                            {collapsed && (
                              <TooltipContent side="right">
                                {label}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      <div className="w-full mb-2" key={index}>
                        <CollapseMenuButton
                          icon={icon}
                          label={label}
                          active={active}
                          submenus={submenus}
                          collapsed={collapsed}
                          id={id}
                        />
                      </div>
                    )
                )}
              </li>
            ))}
            {!collapsed && (
              <li className="w-full grow flex items-end">
                <MenuWidget />
              </li>
            )}
          </ul>
        </nav>
      </ScrollArea>
    </>
  );
}
