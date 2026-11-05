import { Link, useMatchRoute } from '@tanstack/react-router'
import { ListChecksIcon, MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, XIcon } from 'lucide-react'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

/** The apps of homedash, in the order they appear in the sidebar. Add each new feature here. */
const apps = [{ to: '/todos', label: 'Todos', icon: ListChecksIcon, fuzzy: true }] as const

/**
 * The app selector. On a computer it is a sidebar that collapses to a rail of
 * icons (the choice is remembered); on a phone it is a drawer opened from the
 * top bar.
 */
export function AppSidebar() {
  const matchRoute = useMatchRoute()
  const { isMobile, setOpenMobile } = useSidebar()
  // On a phone, picking a page also closes the drawer.
  const closeOnPhone = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="homedash" className="font-semibold">
              <Link to="/" onClick={closeOnPhone}>
                <Logo className="size-5!" />
                <span>homedash</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <nav aria-label="Main">
            <SidebarMenu>
              {apps.map((app) => (
                <SidebarMenuItem key={app.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={Boolean(matchRoute({ to: app.to, fuzzy: app.fuzzy }))}
                    tooltip={app.label}
                    className="data-active:bg-white data-active:shadow-[0_4px_14px_-6px_rgb(43_39_48/0.25)] data-active:[&>svg]:text-primary"
                  >
                    <Link to={app.to} onClick={closeOnPhone}>
                      <app.icon aria-hidden="true" />
                      <span>{app.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </nav>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ToggleButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

/** Collapses or expands the sidebar; on a phone, closes the drawer. */
function ToggleButton() {
  const { isMobile, open, toggleSidebar } = useSidebar()
  const label = isMobile ? 'Close menu' : open ? 'Collapse' : 'Expand'
  const Icon = isMobile ? XIcon : open ? PanelLeftCloseIcon : PanelLeftOpenIcon

  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      tooltip={label}
      aria-expanded={isMobile ? true : open}
      className="text-muted-foreground"
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </SidebarMenuButton>
  )
}

/** Phones only: opens the sidebar as a drawer. */
export function OpenMenuButton() {
  const { openMobile, toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      aria-label="Open menu"
      aria-expanded={openMobile}
      onClick={toggleSidebar}
    >
      <MenuIcon aria-hidden="true" />
    </Button>
  )
}
