import {
  Injectable,
  Logger,
  NotFoundException,
  type OnApplicationBootstrap,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ShapeQuestion } from "../database/entities";
import type { SaveShapeQuestionDto } from "./dto";
import { toShapeQuestion, toShapeRecord } from "./shape.mapper";
import { defaultShapeQuestions } from "./shape-questions.data";

@Injectable()
export class ShapeService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ShapeService.name);

  constructor(
    @InjectRepository(ShapeQuestion)
    private readonly questions: Repository<ShapeQuestion>,
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
        .into(ShapeQuestion)
        .values(defaultShapeQuestions.map((question, position) => ({ ...question, position })))
        .orIgnore()
        .execute();
    } catch (error) {
      this.logger.warn(`Default shape questions not inserted: ${(error as Error).message}`);
    }
  }

  async list() {
    const questions = await this.questions.find({
      order: { position: "ASC", createdAt: "ASC" },
    });
    return questions.map(toShapeQuestion);
  }

  async create(input: SaveShapeQuestionDto) {
    const last = await this.questions.findOne({
      where: {},
      order: { position: "DESC" },
    });
    const saved = await this.questions.save(
      this.questions.create({
        ...toShapeRecord(input),
        position: (last?.position ?? -1) + 1,
      }),
    );
    return toShapeQuestion(saved);
  }

  async update(id: string, input: SaveShapeQuestionDto) {
    const question = await this.questions.findOne({ where: { id } });
    if (!question) throw new NotFoundException("سؤال پیدا نشد.");
    return toShapeQuestion(
      await this.questions.save(Object.assign(question, toShapeRecord(input))),
    );
  }

  async remove(id: string) {
    const result = await this.questions.softDelete({ id });
    if (!result.affected) throw new NotFoundException("سؤال پیدا نشد.");
    return { ok: true };
  }

  async reorder(ids: string[]) {
    await this.questions.manager.transaction(async (manager) => {
      const repository = manager.getRepository(ShapeQuestion);
      for (const [position, id] of ids.entries()) {
        await repository.update({ id }, { position });
      }
    });
    return this.list();
  }
}
