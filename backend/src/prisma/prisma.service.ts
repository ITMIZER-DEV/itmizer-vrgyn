import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super();
        // IMPORTANTE: Retornamos o $extends diretamente do 'this' (instância criada pelo super)
        // Isso evita criar DUAS instâncias do PrismaClient toda vez que o serviço inicia.
        return this.$extends(withAccelerate()) as any;
    }

    async onModuleInit() {
        try {
            // Em ambiente serverless (Vercel), o connect é opcional mas ajuda a validar a URL
            await (this as any).$connect();
            this.logger.log('Prisma Accelerate inicializado com sucesso.');
        } catch (error) {
            this.logger.error('Erro ao conectar ao Prisma Accelerate na inicialização.', error);
        }
    }
}

