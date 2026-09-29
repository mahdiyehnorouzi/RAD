/** One step of the page path; `path` is unlocalised and omitted on the current page. */
export type Crumb = {
  label: string;
  path?: string;
};
