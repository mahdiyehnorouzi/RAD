import type { ShapeQuestion } from "../database/entities";
import type { SaveShapeQuestionDto } from "./dto";
import type { ShapeQuestionView, ShapeTrait } from "./type";

const trimmed = (text: { fa: string; en: string }) => ({
  fa: text.fa.trim(),
  en: text.en.trim(),
});

export function toShapeQuestion(question: ShapeQuestion): ShapeQuestionView {
  const [first, second] = question.choices;
  return {
    id: question.id,
    trait: question.trait as ShapeTrait,
    prompt: question.prompt,
    hint: question.hint,
    choices: [first, second],
  };
}

export function toShapeRecord(input: SaveShapeQuestionDto) {
  return {
    trait: input.trait,
    prompt: trimmed(input.prompt),
    hint: trimmed(input.hint),
    choices: input.choices.map((choice) => ({
      label: trimmed(choice.label),
      note: trimmed(choice.note),
      photo: { src: choice.photo.src.trim(), alt: trimmed(choice.photo.alt) },
      value: choice.value,
    })),
  };
}
