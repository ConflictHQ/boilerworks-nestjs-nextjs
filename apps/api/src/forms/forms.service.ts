import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true });

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: string) {
    return this.prisma.formDefinition.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.formDefinition.findFirst({
      where: { slug },
      orderBy: { version: "desc" },
    });
  }

  async findById(id: string) {
    return this.prisma.formDefinition.findUnique({ where: { id } });
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string | null;
    formType?: string;
    isPublic?: boolean;
    schema?: unknown;
    fieldConfig?: unknown;
    logicRules?: unknown;
    createdById?: string;
  }) {
    return this.prisma.formDefinition.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        formType: data.formType ?? "standard",
        isPublic: data.isPublic ?? false,
        schema: (data.schema as any) ?? {},
        fieldConfig: (data.fieldConfig as any) ?? {},
        logicRules: (data.logicRules as any) ?? [],
        createdById: data.createdById,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      schema?: unknown;
      fieldConfig?: unknown;
      logicRules?: unknown;
      isPublic?: boolean;
    },
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.schema !== undefined) updateData.schema = data.schema;
    if (data.fieldConfig !== undefined) updateData.fieldConfig = data.fieldConfig;
    if (data.logicRules !== undefined) updateData.logicRules = data.logicRules;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    return this.prisma.formDefinition.update({
      where: { id },
      data: updateData,
    });
  }

  async publish(id: string, userId: string) {
    const form = await this.prisma.formDefinition.findUnique({ where: { id } });
    if (!form) return null;

    // Archive any currently published version of this slug
    await this.prisma.formDefinition.updateMany({
      where: { slug: form.slug, status: "published" },
      data: { status: "archived" },
    });

    return this.prisma.formDefinition.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: new Date(),
        publishedById: userId,
      },
    });
  }

  async archive(id: string) {
    return this.prisma.formDefinition.update({
      where: { id },
      data: { status: "archived" },
    });
  }

  async newVersion(id: string) {
    const form = await this.prisma.formDefinition.findUnique({ where: { id } });
    if (!form) return null;

    const maxVersion = await this.prisma.formDefinition.aggregate({
      where: { slug: form.slug },
      _max: { version: true },
    });

    return this.prisma.formDefinition.create({
      data: {
        name: form.name,
        slug: form.slug,
        description: form.description,
        formType: form.formType,
        isPublic: form.isPublic,
        schema: form.schema as any,
        fieldConfig: form.fieldConfig as any,
        logicRules: form.logicRules as any,
        scoring: form.scoring as any,
        prefill: form.prefill as any,
        notificationConfig: form.notificationConfig as any,
        version: (maxVersion._max.version ?? 0) + 1,
        createdById: form.createdById,
      },
    });
  }

  async submit(
    formId: string,
    payload: unknown,
    submittedById?: string,
  ): Promise<{ ok: boolean; errors?: Array<{ field: string | null; message: string }> }> {
    const form = await this.prisma.formDefinition.findUnique({
      where: { id: formId },
    });

    if (!form) return { ok: false, errors: [{ field: null, message: "Form not found" }] };
    if (form.status !== "published") {
      return { ok: false, errors: [{ field: null, message: "Form is not published" }] };
    }

    // Validate against JSON Schema if schema is defined
    const schema = form.schema as Record<string, unknown>;
    if (schema && Object.keys(schema).length > 0) {
      const validate = ajv.compile(schema);
      const valid = validate(payload);
      if (!valid && validate.errors) {
        return {
          ok: false,
          errors: validate.errors.map((e) => ({
            field: e.instancePath?.replace("/", ".") || null,
            message: e.message || "Validation error",
          })),
        };
      }
    }

    await this.prisma.formSubmission.create({
      data: {
        formId,
        payload: payload as any,
        submittedById,
      },
    });

    return { ok: true };
  }

  async getSubmissions(formId: string) {
    return this.prisma.formSubmission.findMany({
      where: { formId },
      orderBy: { submittedAt: "desc" },
      include: { submittedBy: true },
    });
  }
}
