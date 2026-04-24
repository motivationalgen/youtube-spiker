import {
  LayoutDashboard,
  Search,
  Tags,
  Type,
  FileText,
  FolderOpen,
  Settings,
  Play,
  LogIn,
  UserPlus,
  Lightbulb,
  CalendarDays,
  Image,
  Video,
} from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

const seoTools = [
  { title: "Keyword Research", url: "/keyword-research", icon: Search },
  { title: "Tag Generator", url: "/tag-generator", icon: Tags },
  { title: "Title Generator", url: "/title-generator", icon: Type },
  { title: "Description Generator", url: "/description-generator", icon: FileText },
  { title: "Thumbnail Tool", url: "/thumbnail-tool", icon: Image },
];

const contentTools = [
  { title: "Video Ideas", url: "/video-ideas", icon: Lightbulb },
  { title: "Content Planner", url: "/content-planner", icon: CalendarDays },
  { title: "Video Tool", url: "/video-tool", icon: Video },
];

const manageItems = [
  { title: "Saved Projects", url: "/saved-projects", icon: FolderOpen },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();

  const isActive = (path: string) => currentPath === path;

  const renderGroup = (label: string, items: typeof seoTools) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Play className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              Growth Suite
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Dashboard">
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {renderGroup("SEO Tools", seoTools)}
        {renderGroup("Content Tools", contentTools)}
        {renderGroup("Manage", manageItems)}

        {!user && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/login")} tooltip="Sign In">
                    <Link to="/login">
                      <LogIn className="h-4 w-4" />
                      <span>Sign In</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/register")} tooltip="Sign Up">
                    <Link to="/register">
                      <UserPlus className="h-4 w-4" />
                      <span>Sign Up</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <p className="text-xs text-sidebar-foreground/50">
            YouTube Growth Suite v1.0
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
