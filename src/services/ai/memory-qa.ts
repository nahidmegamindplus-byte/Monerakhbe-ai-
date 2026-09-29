import prisma from "@/lib/prisma";

export async function queryUserMemories({
  userId,
  query,
}: {
  userId: string;
  query?: string | null;
}): Promise<{ found: boolean; answer: string; memories: any[] }> {
  try {
    let whereClause: any = { userId };

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      whereClause.OR = [
        { key: { contains: q } },
        { value: { contains: q } },
        { category: { contains: q } },
      ];
    }

    const memories = await prisma.memory.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (memories.length === 0) {
      return {
        found: false,
        answer: query
          ? `আপনার "${query}" সম্পর্কিত কোনো সংরক্ষিত মেমোরি খুঁজে পাওয়া যায়নি।`
          : "আপনার কোনো সংরক্ষিত মেমোরি পাওয়া যায়নি। নতুন তথ্য সংরক্ষণ করতে 'মনে রেখো' বলে মেসেজ দিন।",
        memories: [],
      };
    }

    // Format natural answer
    if (memories.length === 1) {
      const m = memories[0];
      return {
        found: true,
        answer: `📌 ${m.key}: ${m.value} (${m.category})`,
        memories,
      };
    }

    const list = memories.map((m) => `• [${m.category}] ${m.key}: ${m.value}`).join("\n");
    return {
      found: true,
      answer: `🧠 আপনার সংরক্ষিত মেমোরি সমূহ:\n\n${list}`,
      memories,
    };
  } catch (error) {
    console.error("[Memory QA Error]", error);
    return {
      found: false,
      answer: "মেমোরি লোড করতে কিছুটা সমস্যা হয়েছে।",
      memories: [],
    };
  }
}
