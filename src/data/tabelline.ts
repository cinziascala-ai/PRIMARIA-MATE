import type { FactKey, FactTip, QuestionItem, TableInfo } from '../types/game';

export const TABLES_INFO: TableInfo[] = [
  {
    num: 1,
    level: 'Facile',
    motto: 'Lo specchio magico!',
    secretRule: 'Qualsiasi numero moltiplicato per 1 resta identico, proprio come guardarsi allo specchio.',
    example: '1 × 7 = 7',
    fingerOrVisualTip: 'Un solo gruppetto da 7 blocchi vale sempre 7!',
  },
  {
    num: 2,
    level: 'Facile',
    motto: 'La tabellina del doppio!',
    secretRule: 'Moltiplicare per 2 vuol dire sommare il numero a se stesso. Tutti i risultati sono numeri pari!',
    example: '2 × 6 = 6 + 6 = 12',
    fingerOrVisualTip: 'Conta per 2: 2, 4, 6, 8, 10... finiscono sempre con 0, 2, 4, 6 oppure 8.',
  },
  {
    num: 3,
    level: 'Media',
    motto: 'Il doppio più uno!',
    secretRule: 'Fai prima il doppio (×2) e poi aggiungi ancora una volta il numero.',
    example: '3 × 6 = (2 × 6) + 6 = 12 + 6 = 18',
    fingerOrVisualTip: 'Un altro segreto: se sommi le cifre del risultato ottieni sempre 3, 6 o 9 (es. 18 → 1+8 = 9)!',
  },
  {
    num: 4,
    level: 'Media',
    motto: 'Il doppio del doppio!',
    secretRule: 'Raddoppia il numero una volta, poi raddoppia di nuovo quello che hai trovato!',
    example: '4 × 7 → il doppio di 7 è 14, il doppio di 14 è 28!',
    fingerOrVisualTip: 'Tutte le risposte della tabellina del 4 sono numeri pari.',
  },
  {
    num: 5,
    level: 'Facile',
    motto: 'Come le dita di una mano!',
    secretRule: 'I risultati finiscono SEMPRE con 0 oppure con 5, alternati uno dopo l’altro!',
    example: '5, 10, 15, 20, 25, 30, 35, 40, 45, 50',
    fingerOrVisualTip: 'Puoi anche fare ×10 e prendere la metà: 5 × 8 è la metà di 80, cioè 40!',
  },
  {
    num: 6,
    level: 'Media',
    motto: 'Cinque più uno!',
    secretRule: 'Usa la tabellina facile del 5 e aggiungi ancora una volta il numero!',
    example: '6 × 7 = (5 × 7) + 7 = 35 + 7 = 42',
    fingerOrVisualTip: 'Quando moltiplichi 6 per un numero pari (2, 4, 6, 8), il risultato finisce con la stessa cifra: 6×4=24, 6×6=36, 6×8=48!',
  },
  {
    num: 7,
    level: 'Sfida',
    motto: 'La tabellina dei campioni!',
    secretRule: 'Spezzala in due pezzi facili: fai prima ×5 e poi aggiungi ×2!',
    example: '7 × 6 = (5 × 6) + (2 × 6) = 30 + 12 = 42',
    fingerOrVisualTip: 'Ricorda la filastrocca magica: "5, 6, 7, 8 → 56 è 7 per 8!" E 7 × 7 = 49 (come un quadrato!).',
  },
  {
    num: 8,
    level: 'Sfida',
    motto: 'Tre volte il doppio!',
    secretRule: 'Raddoppia 3 volte! Oppure fai ×10 e togli il doppio del numero.',
    example: '8 × 6 = (10 × 6) − (2 × 6) = 60 − 12 = 48',
    fingerOrVisualTip: 'Guarda le cifre delle unità scendendo: 8, 6, 4, 2, 0, 8, 6, 4, 2, 0! Sempre pari.',
  },
  {
    num: 9,
    level: 'Sfida',
    motto: 'Il trucco magico delle 10 dita!',
    secretRule: 'Fai prima ×10 (aggiungi uno zero) e poi togli una volta il numero!',
    example: '9 × 7 = (10 × 7) − 7 = 70 − 7 = 63',
    fingerOrVisualTip: 'Apri 10 dita davanti a te: per fare 9 × 4 abbassa il 4° dito da sinistra. A sinistra restano 3 dita (decine), a destra 6 (unità) → 36!',
  },
  {
    num: 10,
    level: 'Facile',
    motto: 'La regina dello zero!',
    secretRule: 'Prendi il numero e aggiungi uno zero alla fine. Velocissima!',
    example: '10 × 8 = 80',
    fingerOrVisualTip: 'Ogni salto vale una decina intera: 10, 20, 30, 40...',
  },
];

export function getMultiplicationTip(a: number, b: number): FactTip {
  const answer = a * b;
  const commutativeNote =
    a !== b
      ? `Trucco furbo: ${a} × ${b} fa esattamente come ${b} × ${a}! Se sai una delle due, sai anche l'altra.`
      : `Numero gemello! ${a} × ${a} forma un quadrato perfetto con ${a} righe e ${a} colonne.`;

  // Special famous facts first
  if ((a === 7 && b === 8) || (a === 8 && b === 7)) {
    return {
      title: 'La filastrocca del 56!',
      strategy: 'Conta in fila: 5, 6, 7, 8! Proprio così: 56 = 7 × 8. Facile da cantare ad alta voce!',
      commutativeNote,
      breakdownExample: 'Oppure spezza il 7: (5 × 8) + (2 × 8) = 40 + 16 = 56.',
    };
  }

  if ((a === 6 && b === 7) || (a === 7 && b === 6)) {
    return {
      title: 'Parti dalla tabellina del 5!',
      strategy: 'Sai già quanto fa 5 × 7 = 35? Aggiungi ancora un 7: 35 + 7 = 42!',
      commutativeNote,
      breakdownExample: '6 × 7 = (5 × 7) + 7 = 35 + 7 = 42.',
    };
  }

  if ((a === 6 && b === 8) || (a === 8 && b === 6)) {
    return {
      title: 'La regola del 6 con i numeri pari!',
      strategy: 'Quando il 6 incontra un numero pari come l’8, il risultato finisce proprio con 8! È 48.',
      commutativeNote,
      breakdownExample: 'Oppure fai (5 × 8) + 8 = 40 + 8 = 48.',
    };
  }

  if (a === 1 || b === 1) {
    const other = a === 1 ? b : a;
    return {
      title: 'Regola dello specchio (× 1)',
      strategy: `Moltiplicare per 1 lascia il numero com'è! Un solo gruppo da ${other} fa sempre ${other}.`,
      commutativeNote,
      breakdownExample: `${a} × ${b} = ${answer}.`,
    };
  }

  if (a === 10 || b === 10) {
    const other = a === 10 ? b : a;
    return {
      title: 'Aggiungi uno zero (× 10)',
      strategy: `Prendi il ${other} e metti uno 0 alla sua destra: ottieni subito ${answer}!`,
      commutativeNote,
      breakdownExample: `${other} decine = ${answer}.`,
    };
  }

  if (a === 9 || b === 9) {
    const other = a === 9 ? b : a;
    const tens = other - 1;
    const ones = 9 - tens;
    return {
      title: 'Il trucco magico del 9!',
      strategy: `Fai ${other} × 10 = ${other * 10}, poi togli ${other}: ${other * 10} − ${other} = ${answer}. Oppure con le dita: abbassa il ${other}° dito, leggi ${tens} a sinistra e ${ones} a destra!`,
      commutativeNote,
      breakdownExample: `Controlla sempre: ${tens} + ${ones} = 9!`,
    };
  }

  if (a === 5 || b === 5) {
    const other = a === 5 ? b : a;
    return {
      title: 'La metà di × 10!',
      strategy: `Fai ${other} × 10 = ${other * 10} e poi dividi a metà: la metà di ${other * 10} è ${answer}! Ricorda: finisce sempre per 0 o 5.`,
      commutativeNote,
      breakdownExample: `Conta per 5 per ${other} volte fino a ${answer}.`,
    };
  }

  if (a === 2 || b === 2) {
    const other = a === 2 ? b : a;
    return {
      title: 'Fai il doppio!',
      strategy: `Moltiplicare per 2 significa sommare il numero con se stesso: ${other} + ${other} = ${answer}.`,
      commutativeNote,
      breakdownExample: `${other} + ${other} = ${answer}.`,
    };
  }

  if (a === 4 || b === 4) {
    const other = a === 4 ? b : a;
    const doubled = other * 2;
    return {
      title: 'Il doppio del doppio!',
      strategy: `Prima raddoppia ${other} (${other} + ${other} = ${doubled}). Poi raddoppia ancora ${doubled} (${doubled} + ${doubled} = ${answer})!`,
      commutativeNote,
      breakdownExample: `${other} → ×2 fa ${doubled} → ×2 fa ${answer}.`,
    };
  }

  if (a === 3 || b === 3) {
    const other = a === 3 ? b : a;
    const doubled = other * 2;
    return {
      title: 'Il doppio più uno!',
      strategy: `Fai prima il doppio di ${other} (${doubled}) e poi aggiungi ancora un ${other}: ${doubled} + ${other} = ${answer}.`,
      commutativeNote,
      breakdownExample: `(2 × ${other}) + ${other} = ${doubled} + ${other} = ${answer}.`,
    };
  }

  if (a === 8 || b === 8) {
    const other = a === 8 ? b : a;
    const d1 = other * 2;
    const d2 = d1 * 2;
    return {
      title: 'Raddoppia 3 volte (× 8)!',
      strategy: `Parti da ${other} e raddoppia tre volte: ${d1} → ${d2} → ${answer}! Oppure fai (10 × ${other}) − (2 × ${other}) = ${other * 10} − ${d1} = ${answer}.`,
      commutativeNote,
      breakdownExample: `${other} × 2 = ${d1}, × 2 = ${d2}, × 2 = ${answer}.`,
    };
  }

  // Fallback for 6x6, 7x7, etc.
  if (a === b) {
    return {
      title: 'Il quadrato magico!',
      strategy: `È una moltiplicazione tra numeri gemelli! Immagina un quadrato con ${a} righe da ${a} quadretti ciascuna.`,
      commutativeNote,
      breakdownExample: `(5 × ${a}) + (${a - 5} × ${a}) = ${5 * a} + ${(a - 5) * a} = ${answer}.`,
    };
  }

  return {
    title: 'Spezza il numero in due pezzi facili!',
    strategy: `Puoi dividere ${a} in 5 + ${a - 5}: calcola prima 5 × ${b} = ${5 * b}, poi aggiungi ${a - 5} × ${b} = ${(a - 5) * b}.`,
    commutativeNote,
    breakdownExample: `${5 * b} + ${(a - 5) * b} = ${answer}.`,
  };
}

export const PRAISE_MESSAGES = [
  'Bravissimo! Risposta fulminea!',
  'Esatto! Sei una vera freccia delle tabelline!',
  'Fantastico! La maestra è super fiera di te!',
  'Centro perfetto! Continua così!',
  'Ottimo colpo d’occhio matematico!',
  'Che campione! Hai fatto subito il calcolo giusto!',
];

export const ENCOURAGE_MESSAGES = [
  'Quasi! Niente paura, sbagliando si allena il cervello!',
  'Ci sei andato vicino! Guardiamo insieme il trucco per ricordarla al volo.',
  'Nessun problema! Anche i grandi matematici si allenano su questa.',
  'Fermiamoci un attimo a scoprirne il segreto, la prossima la indovini sicuro!',
];

export const PARENT_TIPS = [
  {
    title: 'Bastano 5 minuti al giorno',
    body: 'Meglio allenarsi per pochi minuti ogni giorno (magari dopo merenda o in macchina) che fare un’ora tutta insieme la domenica.',
  },
  {
    title: 'Il segreto che dimezza lo studio',
    body: 'Mostra spesso la proprietà commutativa: se il bambino sa già 3 × 8, allora sa già anche 8 × 3! Così le tabelline da ricordare diventano la metà.',
  },
  {
    title: 'Parti dai punti di riferimento facili',
    body: 'Le tabelline dell’1, del 2, del 5 e del 10 sono le “ancore”. Da quelle si ricavano tutte le altre usando somme o sottrazioni veloci (es. ×6 = ×5 + una volta).',
  },
  {
    title: 'Fallo ragionare ad alta voce con il trucco',
    body: 'Se esita, non dire subito il risultato: suggerisci il trucco (“Quanto fa per 10? E se togli una volta il numero?”). Costruire la strada aiuta la memoria.',
  },
  {
    title: 'Usa gli schieramenti visivi',
    body: 'Vedere 4 righe da 6 quadratini trasforma un numero astratto in un’immagine concreta, proprio come usiamo in classe terza con i quadretti del quaderno.',
  },
  {
    title: 'Festeggia la precisione prima della velocità',
    body: 'La rapidità arriva da sola quando il bambino si sente sicuro. Incoraggia i tentativi e usa la modalità “Sfida Lampo” solo quando si sente pronto a divertirsi!',
  },
];

export function makeFactKey(a: number, b: number): FactKey {
  return `${a}x${b}`;
}

export function generateChoices(a: number, b: number): number[] {
  const correct = a * b;
  const candidates = new Set<number>([correct]);

  // Plausible smart distractors typical of 3rd graders
  const nearOffsets = [a, -a, b, -b, 1, -1, 2, -2, 10, -10];
  for (const offset of nearOffsets) {
    if (candidates.size >= 4) break;
    const val = correct + offset;
    if (val > 0 && val <= 100 && val !== correct) {
      candidates.add(val);
    }
  }

  let fallback = 1;
  while (candidates.size < 4) {
    const val = Math.max(1, correct + fallback);
    if (val !== correct) candidates.add(val);
    fallback = fallback > 0 ? -fallback : -fallback + 1;
  }

  // Deterministic-ish shuffle
  return Array.from(candidates).sort(() => Math.random() - 0.5);
}

export function buildQuestion(a: number, b: number): QuestionItem {
  return {
    a,
    b,
    answer: a * b,
    choices: generateChoices(a, b),
  };
}

export function buildDeck(selectedTables: number[], count: number, includeOrderShuffle = true): QuestionItem[] {
  const pool: Array<[number, number]> = [];
  const tables = selectedTables.length > 0 ? selectedTables : [2, 3, 4, 5];

  for (const t of tables) {
    for (let m = 1; m <= 10; m++) {
      // Mix order naturally so kids practice both 7×3 and 3×7
      if (Math.random() > 0.45) {
        pool.push([t, m]);
      } else {
        pool.push([m, t]);
      }
    }
  }

  if (includeOrderShuffle) {
    pool.sort(() => Math.random() - 0.5);
  }

  const questions: QuestionItem[] = [];
  for (let i = 0; i < count; i++) {
    const pair = pool[i % pool.length];
    questions.push(buildQuestion(pair[0], pair[1]));
  }
  return questions;
}
