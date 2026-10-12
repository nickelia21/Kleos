import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as en from "@zxcvbn-ts/language-en";
import { COMMON_PASSWORDS } from "./common-passwords";

// ---------------------------------------------------------------------------
// Password policy, aligned with NIST 800-63B:
//   · length 12–128, no composition rules ("must contain a symbol" etc.),
//     no periodic rotation anywhere in the product
//   · strength via zxcvbn — score >= 3 required
//   · explicit common-password blocklist
// This module runs identically on the server (better-auth before-hook — the
// enforcement point) and on the client (live strength meter), so the meter
// can never disagree with what the server accepts.
// ---------------------------------------------------------------------------

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_ZXCVBN_SCORE = 3;

let factory: ZxcvbnFactory | null = null;
function getFactory(): ZxcvbnFactory {
  factory ??= new ZxcvbnFactory({
    translations: en.translations,
    graphs: common.adjacencyGraphs,
    dictionary: { ...common.dictionary, ...en.dictionary },
  });
  return factory;
}

export interface PasswordCheck {
  ok: boolean;
  /** zxcvbn score 0–4 (4 = strongest). */
  score: number;
  /** Human-readable reason when not ok. */
  error?: string;
  /** zxcvbn's specific warning, e.g. "Repeated words are easy to guess". */
  warning?: string;
  suggestions: string[];
}

/**
 * @param userInputs identifier/name/handle parts — scored as guessable so
 *   "elia2026kleos" style passwords rank low. "kleos" is always included.
 */
export function checkPassword(password: string, userInputs: string[] = []): PasswordCheck {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      score: 0,
      error: `Use at least ${MIN_PASSWORD_LENGTH} characters. A few random words work great — no symbol/number rules here.`,
      suggestions: [],
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, score: 0, error: `Maximum length is ${MAX_PASSWORD_LENGTH} characters.`, suggestions: [] };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return {
      ok: false,
      score: 0,
      error: "That password is on the commonly-used-passwords list — pick something less guessable.",
      suggestions: ["Try an uncommon phrase of a few unrelated words."],
    };
  }
  const result = getFactory().check(password, ["kleos", ...userInputs.filter(Boolean)]);
  if (result.score < MIN_ZXCVBN_SCORE) {
    return {
      ok: false,
      score: result.score,
      error: result.feedback.warning || "Too guessable — add more unrelated words or characters.",
      warning: result.feedback.warning || undefined,
      suggestions: result.feedback.suggestions,
    };
  }
  return {
    ok: true,
    score: result.score,
    warning: result.feedback.warning || undefined,
    suggestions: result.feedback.suggestions,
  };
}
