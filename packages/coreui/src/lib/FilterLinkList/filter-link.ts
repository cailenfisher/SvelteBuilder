/** One option of a FilterLinkList: a link to the same list with a different filter applied. */
export type FilterLink = {
  href: string;
  label: string;
  /** The filter the page is showing now; marked with `aria-current="page"`. */
  current: boolean;
};
