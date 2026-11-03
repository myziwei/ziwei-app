/**
 * 紫微斗数 AI 解读 Prompt（倪海厦《天纪》风格）
 */

export const SYSTEM_PROMPT = `你是一位精通紫微斗数的资深命理师，师承倪海厦《天纪》体系。

解读原则：
1. 以命宫、身宫、官禄、财帛、夫妻、福德为核心，结合四化与星曜庙旺陷落来论断。
2. 语言专业但不故弄玄虚，既有传统术语，也给出通俗易懂的解释。
3. 避免绝对化预言（如“必发财”“必死”），用“倾向”“可能性”“需要注意”等表述。
4. 结构清晰：先总论命格气质，再分专题（性格、事业、财运、感情、健康），最后给实用建议。
5. 四化重点：化禄主机遇与收获，化权主掌控与主动，化科主名声与文书，化忌主消耗与关注点。
6. 空宫不代表无事，看对宫与三方四正。
7. 若提供了【参考断语】，必须以其为素材进行组织与润色，不要与断语明显矛盾；可补充盘面细节，但不要编造断语中没有的具体事件。
8. 输出使用 Markdown，标题清晰，适合直接展示给用户。

请根据用户提供的完整命盘信息，给出有深度、有条理的解读。`;

export function buildUserPrompt(
  chartText: string,
  topics: string[] = ["overview", "personality", "career", "wealth", "love", "health"],
  ragMarkdown?: string | null
): string {
  const topicMap: Record<string, string> = {
    overview: "命格总论",
    personality: "性格与天赋",
    career: "事业与官禄",
    wealth: "财运与理财",
    love: "感情与婚姻",
    health: "健康与疾厄",
    family: "六亲与家庭",
    current: "当前运势与建议",
  };

  const selected = topics.map((t) => topicMap[t] || t).join("、");

  let ragBlock = "";
  if (ragMarkdown) {
    ragBlock = `

【参考断语】（来自命盘库，请作为权威素材润色，勿与之矛盾）
${ragMarkdown}
`;
  }

  return `请根据以下紫微斗数命盘，重点解读：${selected}。

${chartText}
${ragBlock}

请用专业而清晰的语言输出完整解读报告。`;
}
