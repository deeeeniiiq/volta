"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, RotateCcw } from "lucide-react";
import {
  finderPriorityNotes,
  getFinderRecommendations,
  type FinderBudget,
  type FinderPriority,
  type FinderUse,
} from "@/lib/mac-finder";

const budgetOptions: { value: FinderBudget; title: string; detail: string }[] = [
  { value: "baixo", title: "Quero gastar o mínimo", detail: "Busco uma opção de entrada para começar." },
  { value: "medio", title: "Posso investir um pouco mais", detail: "Procuro equilíbrio entre investimento e uso." },
  { value: "alto", title: "Tenho mais flexibilidade", detail: "Aceito investir mais por uma escolha com mais fôlego." },
];

const useOptions: { value: FinderUse; title: string; detail: string }[] = [
  { value: "essencial", title: "O essencial do dia a dia", detail: "Navegador, documentos, aulas e planilhas simples." },
  { value: "multitarefa", title: "Trabalho com mais coisas abertas", detail: "Várias abas, reuniões, planilhas e aplicativos ao mesmo tempo." },
  { value: "exigente", title: "Tarefas mais exigentes", detail: "Edição, programação ou programas que pedem mais processamento." },
];

const priorityOptions: { value: FinderPriority; title: string }[] = [
  { value: "nenhuma", title: "Sem preferência" },
  { value: "mobilidade", title: "Portabilidade" },
  { value: "tela", title: "Tamanho da tela" },
  { value: "bateria", title: "Bateria" },
  { value: "conservacao", title: "Conservação" },
];

export function MacFinder() {
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState<FinderBudget | null>(null);
  const [usage, setUsage] = useState<FinderUse | null>(null);
  const [priority, setPriority] = useState<FinderPriority>("nenhuma");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (step > 0) headingRef.current?.focus();
  }, [step]);

  const recommendations = budget && usage ? getFinderRecommendations(budget, usage) : [];
  const hasTradeoff = recommendations.length > 0 && recommendations.every((model) => model.aboveBudget || model.belowUse);

  function next() {
    if (step === 0 && !budget) return;
    if (step === 1 && !usage) return;
    setStep((current) => Math.min(current + 1, 3));
  }

  function restart() {
    setBudget(null);
    setUsage(null);
    setPriority("nenhuma");
    setStep(0);
  }

  return (
    <div className="mf-panel" id="questionario">
      <div className="mf-panel-top">
        <span className="mf-panel-eyebrow">GUIA VOLTA. / 3 RESPOSTAS</span>
        <span className="mf-step-count">{step === 3 ? "SEU RESULTADO" : `0${step + 1} / 03`}</span>
      </div>
      <div className="mf-progress" aria-hidden="true"><span style={{ transform: `scaleX(${step === 3 ? 1 : (step + 1) / 3})` }} /></div>

      {step === 0 && (
        <div className="mf-step" key="budget">
          <p className="mf-step-label">01 — INVESTIMENTO</p>
          <h2 ref={headingRef}>Quanto você quer investir?</h2>
          <p className="mf-step-copy">Escolha uma faixa relativa. Os preços reais variam conforme a configuração e o estado de cada unidade.</p>
          <div className="mf-options" role="group" aria-label="Faixa de investimento">
            {budgetOptions.map((option) => (
              <button key={option.value} type="button" className="mf-option" aria-pressed={budget === option.value} onClick={() => setBudget(option.value)}>
                <span className="mf-option-content"><strong>{option.title}</strong><small>{option.detail}</small></span>
                <span className="mf-option-indicator" aria-hidden="true">{budget === option.value && <Check size={17} />}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mf-step" key="usage">
          <p className="mf-step-label">02 — ROTINA</p>
          <h2 ref={headingRef} tabIndex={-1}>O que você vai fazer no Mac?</h2>
          <p className="mf-step-copy">Pense no uso mais pesado que fará com frequência, não apenas no que faz hoje.</p>
          <div className="mf-options" role="group" aria-label="Tipo de uso">
            {useOptions.map((option) => (
              <button key={option.value} type="button" className="mf-option" aria-pressed={usage === option.value} onClick={() => setUsage(option.value)}>
                <span className="mf-option-content"><strong>{option.title}</strong><small>{option.detail}</small></span>
                <span className="mf-option-indicator" aria-hidden="true">{usage === option.value && <Check size={17} />}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mf-step" key="priority">
          <p className="mf-step-label">03 — DETALHE</p>
          <h2 ref={headingRef} tabIndex={-1}>O que mais importa para você?</h2>
          <p className="mf-step-copy">Esta resposta indica o que observar nos anúncios. A recomendação do modelo continua baseada principalmente no investimento e no uso.</p>
          <div className="mf-priority-options" role="group" aria-label="Detalhe prioritário">
            {priorityOptions.map((option) => (
              <button key={option.value} type="button" className="mf-priority-option" aria-pressed={priority === option.value} onClick={() => setPriority(option.value)}>
                {option.title}<span aria-hidden="true">{priority === option.value ? "✓" : "+"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && budget && usage && (
        <div className="mf-step mf-result" key="result">
          <p className="mf-step-label">A SUA DIREÇÃO</p>
          <h2 ref={headingRef} tabIndex={-1}>Dois caminhos para o seu próximo Mac.</h2>
          <p className="mf-step-copy">{hasTradeoff
            ? "Nenhum dos três perfis concilia totalmente a faixa de investimento e o uso que você escolheu. Veja os compromissos de cada opção."
            : "Selecionamos dois perfis de modelo para você comparar com calma. A indicação não depende do estoque atual."}</p>

          <div className="mf-results">
            {recommendations.map((model, index) => (
              <article className={`mf-result-card ${index === 0 ? "mf-result-primary" : ""}`} key={model.id}>
                <div className="mf-result-top"><span>{index === 0 ? "01 / NOSSA INDICAÇÃO" : "02 / OUTRO CAMINHO"}</span><span>{model.label}</span></div>
                <div className="mf-result-name"><span className="mf-result-number">0{index + 1}</span><h3>{model.name}</h3></div>
                <p>{model.description}</p>
                <div className="mf-result-flags">
                  {model.aboveBudget ? <span>Acima da faixa escolhida</span> : <span>Faixa de investimento alinhada</span>}
                  {model.belowUse ? <span>Confira os limites para seu uso</span> : <span>Perfil de uso alinhado</span>}
                </div>
                <Link href={model.catalogHref}>Procurar no catálogo <ArrowUpRight size={17} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>

          <div className="mf-result-note"><strong>Na hora de escolher a unidade</strong><p>{finderPriorityNotes[priority]}</p></div>
          <p className="mf-disclaimer">Guia inicial de perfis, sem preço ou disponibilidade garantidos. Desempenho, compatibilidade, bateria e conservação dependem da configuração e da unidade anunciada.</p>
        </div>
      )}

      <div className="mf-controls">
        {step > 0 ? (
          <button className="mf-back" type="button" onClick={() => setStep(step === 3 ? 2 : step - 1)}><ArrowLeft size={17} aria-hidden="true" /> {step === 3 ? "Alterar respostas" : "Voltar"}</button>
        ) : <span className="mf-control-hint">Leva menos de um minuto.</span>}
        {step < 3 ? (
          <button className="mf-next" type="button" onClick={next} disabled={(step === 0 && !budget) || (step === 1 && !usage)}>
            {step === 2 ? "Ver minhas opções" : "Continuar"} <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <button className="mf-restart" type="button" onClick={restart}>Recomeçar <RotateCcw size={16} aria-hidden="true" /></button>
        )}
      </div>
    </div>
  );
}
