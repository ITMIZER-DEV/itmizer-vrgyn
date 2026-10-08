import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super();
        const dbUrl = process.env.DATABASE_URL || '';
        if (dbUrl.startsWith('prisma://')) {
            this.logger.log('Conexão configurada para Prisma Accelerate Proxy.');
            return this.$extends(withAccelerate()) as any;
        }
    }

    async onModuleInit() {
        try {
            await (this as any).$connect();
            this.logger.log('Prisma conectado ao banco de dados com sucesso.');
        } catch (error) {
            this.logger.error('Erro ao conectar ao banco de dados na inicialização.', error);
        }
    }
}

