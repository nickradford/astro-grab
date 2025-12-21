import { instrumentAstroFile } from "./parser.js";

export const transformAstroFile = async (
  code: string,
  id: string,
  root?: string,
): Promise<{ code: string } | null> => {
  if (!id.endsWith(".astro")) {
    return null;
  }

  if (id.includes("node_modules")) {
    return null;
  }

  try {
    return await instrumentAstroFile(code, id, root);
  } catch (error) {
    console.error(`[astro-grab] Error transforming ${id}:`, error);
    return { code };
  }
};
