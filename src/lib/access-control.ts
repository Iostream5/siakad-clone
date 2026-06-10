import { sidebarItems } from "@/lib/constants";
import type { SidebarItem, UserRole } from "@/types/domain";

export type MenuDefinition = {
  key: string;
  href: string;
  label: string;
  parentKey: string | null;
  roles: UserRole[];
};

export const menuDefinitions: MenuDefinition[] = sidebarItems.flatMap((item) => {
  const children =
    item.children?.map((child) => ({
      key: child.key,
      href: child.href,
      label: child.label,
      parentKey: item.key,
      roles: child.roles ?? item.roles,
    })) ?? [];

  return [
    {
      key: item.key,
      href: item.href,
      label: item.label,
      parentKey: null,
      roles: item.roles,
    },
    ...children,
  ];
});

export function getDefaultMenuKeysForRole(role: UserRole) {
  return new Set(menuDefinitions.filter((item) => item.roles.includes(role)).map((item) => item.key));
}

export function applyMenuOverrides(baseKeys: Set<string>, overrides: Array<{ menu_key: string; is_allowed: boolean }>) {
  const resolved = new Set(baseKeys);

  overrides.forEach((item) => {
    if (item.is_allowed) {
      resolved.add(item.menu_key);
    } else {
      resolved.delete(item.menu_key);
    }
  });

  return resolved;
}

export function filterSidebarItemsByAccess(allowedKeys: Set<string>) {
  const visibleItems: SidebarItem[] = [];

  sidebarItems.forEach((item) => {
      const visibleChildren = item.children?.filter((child) => allowedKeys.has(child.key)) ?? [];

      if (!allowedKeys.has(item.key) && visibleChildren.length === 0) {
        return;
      }

      visibleItems.push({
        ...item,
        children: visibleChildren,
      });
    });

  return visibleItems;
}

export function getAllMenuKeys() {
  return menuDefinitions.map((item) => item.key);
}

export function getMenuDefinition(menuKey: string) {
  return menuDefinitions.find((item) => item.key === menuKey) ?? null;
}
