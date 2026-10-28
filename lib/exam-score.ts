/**
 * Deneme girişinde puan ve net hesapları.
 *
 * Net kuralı kurumdan kuruma değişir: LGS'de 3 yanlış bir doğruyu götürür,
 * YKS'de 4. Yanlışın doğruyu götürmediği denemeler de var (0).
 */
export type NetRule = 0 | 3 | 4;

export type SubjectCounts = { correct: number; wrong: number; blank: number; questions?: number };

export const NET_RULES: { value: NetRule; label: string }[] = [
  { value: 3, label: "3 yanlış 1 doğruyu götürür (LGS)" },
  { value: 4, label: "4 yanlış 1 doğruyu götürür" },
  { value: 0, label: "Yanlış doğruyu götürmez" },
];

const count = (value: number | undefined) => Math.max(0, Math.floor(Number(value) || 0));

export function netOf(correct: number, wrong: number, rule: NetRule): number {
  const net = rule ? count(correct) - count(wrong) / rule : count(correct);
  return Math.round(net * 100) / 100;
}

/** Soru sayısı girilmişse doğru + yanlış + boş onu tutmalı. */
export function hasMismatch(subject: SubjectCounts): boolean {
  const questions = count(subject.questions);
  if (!questions) return false;
  return count(subject.correct) + count(subject.wrong) + count(subject.blank) !== questions;
}

/** Soru sayısı biliniyorsa boş = soru − doğru − yanlış (negatife düşmez). */
export function blankFor(subject: SubjectCounts): number {
  const questions = count(subject.questions);
  if (!questions) return count(subject.blank);
  return Math.max(0, questions - count(subject.correct) - count(subject.wrong));
}

export function totalsOf(subjects: SubjectCounts[], rule: NetRule) {
  let correct = 0, wrong = 0, blank = 0, questions = 0;
  for (const s of subjects) {
    correct += count(s.correct);
    wrong += count(s.wrong);
    blank += count(s.blank);
    questions += count(s.questions) || count(s.correct) + count(s.wrong) + count(s.blank);
  }
  return { correct, wrong, blank, questions, net: netOf(correct, wrong, rule) };
}

/**
 * Önerilen puan: netin toplam soruya oranı, 100 üzerinden. Hiç soru yoksa
 * puan önerilmez (null); eksi net 0 puana yuvarlanır.
 */
export function suggestedScore(subjects: SubjectCounts[], rule: NetRule): number | null {
  const { questions, net } = totalsOf(subjects, rule);
  if (!questions) return null;
  return Math.round((Math.max(0, net) / questions) * 10000) / 100;
}
