import {
  Injectable,
  Logger,
  NotFoundException,
  type OnApplicationBootstrap,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HelpQuestion } from "../database/entities";
import type { SaveHelpQuestionDto } from "./dto";
import { toHelpQuestion, toHelpRecord } from "./help.mapper";
import { defaultHelpQuestions } from "./help-questions.data";

@Injectable()
export class HelpService implements OnApplicationBootstrap {
  private readonly logger = new Logger(HelpService.name);

  constructor(
    @InjectRepository(HelpQuestion)
    private readonly questions: Repository<HelpQuestion>,
  ) {}

  /**
   * Inserts any default question whose id has never existed. Deleted ones are
   * soft-deleted, so they keep their id and are not brought back.
   */
  async onApplicationBootstrap() {
    try {
      await this.questions
        .createQueryBuilder()
        .insert()
        .into(HelpQuestion)
        .values(
          defaultHelpQuestions.map((question, position) => ({
            id: question.id,
            ...toHelpRecord(question),
            position,
          })),
        )
        .orIgnore()
        .execute();
    } catch (error) {
      this.logger.warn(`Default help questions not inserted: ${(error as Error).message}`);
    }
  }

  async list() {
    const questions = await this.questions.find({
      order: { position: "ASC", createdAt: "ASC" },
    });
    return questions.map(toHelpQuestion);
  }

  async create(input: SaveHelpQuestionDto) {
    const last = await this.questions.findOne({
      where: {},
      order: { position: "DESC" },
    });
    const saved = await this.questions.save(
      this.questions.create({
        ...toHelpRecord(input),
        position: (last?.position ?? -1) + 1,
      }),
    );
    return toHelpQuestion(saved);
  }

  async update(id: string, input: SaveHelpQuestionDto) {
    const question = await this.questions.findOne({ where: { id } });
    if (!question) throw new NotFoundException("سؤال پیدا نشد.");
    return toHelpQuestion(
      await this.questions.save(Object.assign(question, toHelpRecord(input))),
    );
  }

  async remove(id: string) {
    const result = await this.questions.softDelete({ id });
    if (!result.affected) throw new NotFoundException("سؤال پیدا نشد.");
    return { ok: true };
  }

  async reorder(ids: string[]) {
    await this.questions.manager.transaction(async (manager) => {
      const repository = manager.getRepository(HelpQuestion);
      for (const [position, id] of ids.entries()) {
        await repository.update({ id }, { position });
      }
    });
    return this.list();
  }
}
