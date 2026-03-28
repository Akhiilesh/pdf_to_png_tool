import { DefinedTool, ToolCategory, UserType } from './defineTool';
import { capitalizeFirstLetter } from '@utils/string';
import { Entries } from 'type-fest';
import { IconifyIcon } from '@iconify/react';
import { pdfTools } from '../pages/tools/pdf';
import { TFunction } from 'i18next';
import { FullI18nKey, I18nNamespaces } from '../i18n';

const toolCategoriesOrder: ToolCategory[] = ['pdf'];
export const tools: DefinedTool[] = [...pdfTools];
const categoriesConfig: {
  type: ToolCategory;
  title: FullI18nKey;
  value: FullI18nKey;
  icon: IconifyIcon | string;
}[] = [
  {
    type: 'pdf',
    icon: 'tabler:pdf',
    value: 'translation:categories.pdf.description',
    title: 'translation:categories.pdf.title'
  }
];
const CATEGORIES_USER_TYPES_MAPPINGS: Partial<Record<ToolCategory, UserType>> =
  {
    converters: 'generalUsers'
  };
// Filter tools by user types
export const filterToolsByUserTypes = (
  tools: DefinedTool[],
  userTypes: UserType[]
): DefinedTool[] => {
  if (userTypes.length === 0) return tools;

  return tools.filter((tool) => {
    if (CATEGORIES_USER_TYPES_MAPPINGS[tool.type]) {
      return userTypes.includes(CATEGORIES_USER_TYPES_MAPPINGS[tool.type]!);
    }
    // If tool has no userTypes defined, show it to all users
    if (!tool.userTypes || tool.userTypes.length === 0) return true;

    // Check if tool has any of the selected user types
    return tool.userTypes.some((userType) => userTypes.includes(userType));
  });
};

/**
 * Returns the Levenshtein distance between two strings.
 * @param a - First string.
 * @param b - Second string.
 * @returns Minimum number of single-character edits (insert, delete, substitute).
 */
const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const dp: number[][] = Array.from({ length: aLen + 1 }, () =>
    Array<number>(bLen + 1).fill(0)
  );

  for (let i = 0; i <= aLen; i += 1) dp[i][0] = i;
  for (let j = 0; j <= bLen; j += 1) dp[0][j] = j;

  for (let i = 1; i <= aLen; i += 1) {
    for (let j = 1; j <= bLen; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[aLen][bLen];
};

type SearchField = {
  text: string;
  words: string[];
  weight: number;
};

const splitWords = (text: string): string[] =>
  text.split(/[^a-z0-9]+/g).filter(Boolean);

/**
 * Normalizes a string by converting it to lowercase and removing diacritics
 * (accent marks). Useful for locale-insensitive string comparison and search.
 *
 * @param text - The string to normalize
 * @returns The normalized string with lowercase letters and no diacritics
 */
const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/\s+/g, ' ');

const computeToolScore = (
  tool: DefinedTool,
  tokens: string[],
  t: TFunction<I18nNamespaces[]>
): number => {
  const name = normalizeText(t(tool.name));
  const shortDescription = normalizeText(t(tool.shortDescription));
  const description = normalizeText(t(tool.description));

  const fields: SearchField[] = [
    { text: name, words: splitWords(name), weight: 5 },
    { text: shortDescription, words: splitWords(shortDescription), weight: 3 },
    { text: description, words: splitWords(description), weight: 2 },
    ...(tool.keywords ?? []).map((kw) => {
      const normalized = normalizeText(kw);
      return {
        text: normalized,
        words: splitWords(normalized),
        weight: 4
      };
    })
  ];

  let totalScore = 0;

  for (const token of tokens) {
    if (!token) continue;

    let bestForToken = 0;

    for (const field of fields) {
      let fieldScore = 0;

      if (field.text.includes(token)) {
        // Base score for substring match
        fieldScore = field.weight * 2;

        if (field.words.includes(token)) {
          // Boost whole-word matches
          fieldScore += field.weight;
        }
      } else {
        for (const word of field.words) {
          // Quick length check before full distance calculation
          if (Math.abs(word.length - token.length) > 1) continue;

          const dist = levenshtein(token, word);
          if (dist === 1) {
            fieldScore = Math.max(fieldScore, field.weight);
          }
        }
      }

      if (fieldScore > bestForToken) {
        bestForToken = fieldScore;
      }
    }
    // If any token fails to match (exact or fuzzy), treat the tool as a non-match.
    if (bestForToken === 0) return 0;

    totalScore += bestForToken;
  }

  return totalScore;
};

export const filterTools = (
  tools: DefinedTool[],
  query: string,
  userTypes: UserType[] = [],
  t: TFunction<I18nNamespaces[]>
): DefinedTool[] => {
  let filteredTools = tools;

  // First filter by user types
  if (userTypes.length > 0) {
    filteredTools = filterToolsByUserTypes(tools, userTypes);
  }

  const normalizedQuery = normalizeText(query);

  // If query is empty after normalization, return all tools (after user-type filtering)
  if (!normalizedQuery) return filteredTools;

  const rawTokens = normalizedQuery.split(' ').filter(Boolean);
  if (rawTokens.length === 0) return filteredTools;

  // Expand tokens with simple alpha+digit concatenation variants, e.g. "base" + "64" -> "base64".
  // This, combined with per-tool `keywords`, allows us to support aliases like
  // "base 64" / "base64" / "b64" without requiring every form in every keyword list.
  const tokens: string[] = [...rawTokens];

  for (let i = 0; i < rawTokens.length - 1; i += 1) {
    const current = rawTokens[i];
    const next = rawTokens[i + 1];

    if (/^[a-zA-Z]+$/.test(current) && /^\d+$/.test(next)) {
      tokens.push(`${current}${next}`);
    }
  }

  const scored = filteredTools
    .map((tool) => ({
      tool,
      score: computeToolScore(tool, tokens, t)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aName = t(a.tool.name).toLowerCase();
      const bName = t(b.tool.name).toLowerCase();

      return aName.localeCompare(bName);
    });

  return scored.map(({ tool }) => tool);
};

export const getToolsByCategory = (
  userTypes: UserType[] = [],
  t: TFunction<I18nNamespaces[]>
): {
  title: string;
  rawTitle: string;
  description: string;
  icon: IconifyIcon | string;
  type: ToolCategory;
  example: { title: string; path: string };
  tools: DefinedTool[];
  userTypes: UserType[]; // <-- Add this line
}[] => {
  const groupedByType: Partial<Record<ToolCategory, DefinedTool[]>> =
    Object.groupBy(tools, ({ type }) => type);

  return (Object.entries(groupedByType) as Entries<typeof groupedByType>)
    .map(([type, tools]) => {
      const categoryConfig = categoriesConfig.find(
        (config) => config.type === type
      );

      // Filter tools by user types if specified
      const filteredTools =
        userTypes.length > 0
          ? filterToolsByUserTypes(tools ?? [], userTypes)
          : tools ?? [];

      // Aggregate unique userTypes from all tools in this category
      const aggregatedUserTypes = Array.from(
        new Set((filteredTools ?? []).flatMap((tool) => tool.userTypes ?? []))
      );

      return {
        rawTitle: categoryConfig?.title
          ? t(categoryConfig.title)
          : capitalizeFirstLetter(type),
        title: categoryConfig?.title
          ? t(categoryConfig.title)
          : `${capitalizeFirstLetter(type)} Tools`,
        description: categoryConfig?.value ? t(categoryConfig.value) : '',
        type,
        icon: categoryConfig!.icon,
        tools: filteredTools,
        example:
          filteredTools.length > 0
            ? { title: filteredTools[0].name, path: filteredTools[0].path }
            : { title: '', path: '' },
        userTypes: aggregatedUserTypes // <-- Add this line
      };
    })
    .filter((category) => category.tools.length > 0)
    .filter((category) =>
      userTypes.length > 0
        ? [...category.userTypes, CATEGORIES_USER_TYPES_MAPPINGS[category.type]]
            .filter(Boolean)
            .some((categoryUserType) => userTypes.includes(categoryUserType!))
        : true
    ) // Only show categories with tools
    .sort(
      (a, b) =>
        toolCategoriesOrder.indexOf(a.type) -
        toolCategoriesOrder.indexOf(b.type)
    );
};
