import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // TODO: implement
    return [];
  }

  async findById(id: string) {
    // TODO: implement
    return null;
  }
}
