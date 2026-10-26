import type { PostIcon } from "../config/icons";

export interface Breadcrumb {
  label: string;
  path?: string;
}

export interface PostSummary {
  path: string;
  title: string;
  created?: string;
  icon: PostIcon;
}

export interface SearchPage {
  path: string;
  icon: PostIcon;
}

export interface Pagination {
  current: number;
  pages: { number: number; path: string }[];
  previous?: string;
  next?: string;
}

export interface PageData {
  kind: "home" | "page" | "search" | "404";
  path: string;
  title: string;
  description: string;
  breadcrumbs: Breadcrumb[];
  body?: string;
  created?: string;
  updated?: string;
  isPost?: boolean;
  posts?: PostSummary[];
  pagination?: Pagination;
  searchPages?: Record<string, SearchPage>;
}
