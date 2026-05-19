import { asc } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { communities } from "@/db/schema";

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  is_private: boolean;
};

const seedCommunities: Community[] = [
  {
    id: "security-specialists",
    slug: "security-specialists",
    name: "Security specialists",
    description: "Cybersecurity, risk, compliance and secure engineering across the community.",
    category: "professional",
    is_private: true,
  },
  {
    id: "engineers",
    slug: "engineers",
    name: "Engineers",
    description: "Software, data, cloud and platform builders sharing practical expertise.",
    category: "professional",
    is_private: true,
  },
  {
    id: "product-design",
    slug: "product-design",
    name: "Product & design",
    description: "Product managers, UX designers and makers shaping better digital products.",
    category: "professional",
    is_private: true,
  },
  {
    id: "football",
    slug: "football",
    name: "Football",
    description: "A lighter social space for members who connect around football.",
    category: "social",
    is_private: true,
  },
];

export async function getCommunities(): Promise<Community[]> {
  if (!hasDatabase()) return seedCommunities;

  try {
    const db = getDb();
    const rows = await db.select().from(communities).orderBy(asc(communities.category), asc(communities.name));
    return rows.map((community) => ({
      id: community.id,
      slug: community.slug,
      name: community.name,
      description: community.description,
      category: community.category,
      is_private: community.isPrivate,
    }));
  } catch {
    return seedCommunities;
  }
}
