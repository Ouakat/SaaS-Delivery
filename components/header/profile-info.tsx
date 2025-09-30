"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ProfileInfo = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated, checkAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check auth status on component mount
  useEffect(() => {
    if (!user && isAuthenticated) {
      checkAuth();
    }
  }, [user, isAuthenticated, checkAuth]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch (error) {
      toast.error("Logout failed");
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Loading state
  if (!user && isAuthenticated) {
    return (
      <div className="md:block hidden">
        <div className="flex items-center gap-3 text-default-800">
          <div className="w-9 h-9 bg-default-200 rounded-full animate-pulse" />
          <div className="lg:block hidden">
            <div className="w-20 h-4 bg-default-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render the component
  if (!isAuthenticated || !user) {
    return null;
  }

  const displayName = user.name || "Unknown User";
  const displayEmail = user.email || "";
  const userTypeDisplay =
    user.userType?.toLowerCase().replace("_", " ") || "user";
  const avatarSrc = user.avatar || "/images/avatar/av-1.jpg";

  return (
    <div className="md:block hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="cursor-pointer">
          <div className="flex items-center gap-3 text-default-800">
            <Image
              src={avatarSrc}
              alt={displayName}
              width={36}
              height={36}
              className="rounded-full object-cover"
              onError={(e) => {
                // Fallback to default avatar on error
                e.currentTarget.src = "/images/avatar/av-1.jpg";
              }}
            />

            <div className="text-sm font-medium capitalize lg:block hidden">
              {displayName}
            </div>
            <span className="text-base me-2.5 lg:inline-block hidden">
              <Icon icon="heroicons-outline:chevron-down" />
            </span>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56 p-0" align="end">
          <DropdownMenuLabel className="flex gap-2 items-center mb-1 p-3">
            <Image
              src={avatarSrc}
              alt={displayName}
              width={36}
              height={36}
              className="rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/images/avatar/av-1.jpg";
              }}
            />

            <div>
              <div className="text-sm font-medium text-default-800 capitalize">
                {displayName}
              </div>
              <div className="text-xs text-default-600">{displayEmail}</div>
              <div className="text-xs text-default-500 capitalize">
                {userTypeDisplay}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuGroup>
            <Link href="/profile" className="cursor-pointer">
              <DropdownMenuItem className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 cursor-pointer">
                <Icon icon="heroicons:user" className="w-4 h-4" />
                Profile
              </DropdownMenuItem>
            </Link>

            {/* {[
              {
                name: "Billing",
                icon: "heroicons:megaphone",
                href: "/dashboard",
              },
              {
                name: "Settings",
                icon: "heroicons:paper-airplane",
                href: "/dashboard",
              },
              {
                name: "Keyboard shortcuts",
                icon: "heroicons:language",
                href: "/dashboard",
              },
            ].map((item, index) => (
              <Link
                href={item.href}
                key={`info-menu-${index}`}
                className="cursor-pointer"
              >
                <DropdownMenuItem className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 cursor-pointer">
                  <Icon icon={item.icon} className="w-4 h-4" />
                  {item.name}
                </DropdownMenuItem>
              </Link>
            ))} */}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* <DropdownMenuGroup>
            <Link href="/dashboard" className="cursor-pointer">
              <DropdownMenuItem className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 cursor-pointer">
                <Icon icon="heroicons:user-group" className="w-4 h-4" />
                Team
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5">
                <Icon icon="heroicons:user-plus" className="w-4 h-4" />
                Invite user
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {[
                    { name: "Email" },
                    { name: "Message" },
                    { name: "Facebook" },
                  ].map((item, index) => (
                    <Link
                      href="/dashboard"
                      key={`invite-sub-${index}`}
                      className="cursor-pointer"
                    >
                      <DropdownMenuItem className="text-sm font-medium text-default-600 capitalize px-3 py-1.5 cursor-pointer">
                        {item.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <Link href="/dashboard">
              <DropdownMenuItem className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 cursor-pointer">
                <Icon icon="heroicons:variable" className="w-4 h-4" />
                Github
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 cursor-pointer">
                <Icon icon="heroicons:phone" className="w-4 h-4" />
                Support
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {[
                    { name: "Portal" },
                    { name: "Slack" },
                    { name: "WhatsApp" },
                  ].map((item, index) => (
                    <Link href="/dashboard" key={`support-sub-${index}`}>
                      <DropdownMenuItem className="text-sm font-medium text-default-600 capitalize px-3 py-1.5 cursor-pointer">
                        {item.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup> */}

          <DropdownMenuSeparator className="mb-0 dark:bg-background" />

          <DropdownMenuItem
            className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize my-1 px-3 cursor-pointer"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <Icon
              icon={isLoggingOut ? "heroicons:arrow-path" : "heroicons:power"}
              className={`w-4 h-4 ${isLoggingOut ? "animate-spin" : ""}`}
            />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProfileInfo;
