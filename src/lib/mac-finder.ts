export type FinderBudget = "baixo" | "medio" | "alto";
export type FinderUse = "essencial" | "multitarefa" | "exigente";
export type FinderPriority = "nenhuma" | "mobilidade" | "tela" | "bateria" | "conservacao";

export type FinderModel = {
  id: "pro-2017" | "pro-2019" | "m1";
  name: string;
  shortName: string;
  tier: number;
  label: string;
  description: string;
  catalogHref: string;
};

export const finderModels: Record<FinderModel["id"], FinderModel> = {
  "pro-2017": {
    id: "pro-2017",
    name: "MacBook Pro 2017",
    shortName: "Pro 2017",
    tier: 0,
    label: "Essencial",
    description: "Uma porta de entrada para navegador, documentos e tarefas leves do dia a dia.",
    catalogHref: "/catalogo?serie=Pro&busca=2017",
  },
  "pro-2019": {
    id: "pro-2019",
    name: "MacBook Pro 2019",
    shortName: "Pro 2019",
    tier: 1,
    label: "Equilíbrio",
    description: "Um caminho intermediário para uma rotina com mais abas, aplicativos e multitarefa.",
    catalogHref: "/catalogo?serie=Pro&busca=2019",
  },
  m1: {
    id: "m1",
    name: "MacBook com chip M1",
    shortName: "Mac com M1",
    tier: 2,
    label: "Mais fôlego",
    description: "A escolha de maior investimento deste guia para quem busca mais margem de desempenho.",
    catalogHref: "/catalogo?chip=M1",
  },
};

// Curadoria inicial do protótipo. A indicação é de famílias de modelos,
// independente do estoque e sem supor um preço fixo para cada unidade.
const recommendationOrder: Record<FinderBudget, Record<FinderUse, readonly [FinderModel["id"], FinderModel["id"]]>> = {
  baixo: {
    essencial: ["pro-2017", "pro-2019"],
    multitarefa: ["pro-2019", "pro-2017"],
    exigente: ["m1", "pro-2019"],
  },
  medio: {
    essencial: ["pro-2017", "pro-2019"],
    multitarefa: ["pro-2019", "m1"],
    exigente: ["m1", "pro-2019"],
  },
  alto: {
    essencial: ["m1", "pro-2019"],
    multitarefa: ["m1", "pro-2019"],
    exigente: ["m1", "pro-2019"],
  },
};

const budgetLevel: Record<FinderBudget, number> = { baixo: 0, medio: 1, alto: 2 };
const useLevel: Record<FinderUse, number> = { essencial: 0, multitarefa: 1, exigente: 2 };

export function getFinderRecommendations(budget: FinderBudget, use: FinderUse) {
  return recommendationOrder[budget][use].map((id) => {
    const model = finderModels[id];
    return {
      ...model,
      aboveBudget: model.tier > budgetLevel[budget],
      belowUse: model.tier < useLevel[use],
    };
  });
}

export const finderPriorityNotes: Record<FinderPriority, string> = {
  nenhuma: "Compare a configuração, a bateria e a conservação de cada unidade antes de decidir.",
  mobilidade: "Confira peso e dimensões na ficha da unidade: podem mudar entre versões do mesmo ano.",
  tela: "Confira o tamanho da tela na ficha da unidade: há variações dentro de cada família.",
  bateria: "Confira a saúde e os ciclos da bateria da unidade. A autonomia real depende do estado e do uso.",
  conservacao: "Confira fotos e observações da unidade. O ano do modelo não determina a conservação.",
};
