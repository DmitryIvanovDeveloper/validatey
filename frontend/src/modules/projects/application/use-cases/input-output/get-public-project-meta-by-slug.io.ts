export type GetPublicProjectMetaBySlugRequest = {
  slug: string;
};

export type GetPublicProjectMetaBySlugResponse = {
  id: string;
  name: string;
  publicSlug: string;
};
