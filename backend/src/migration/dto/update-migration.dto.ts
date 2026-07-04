import { PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CreateMigrationDto } from './create-migration.dto';

enum MigrationStatus {
    PENDENTE = 'pendente',
    EM_VALIDACAO = 'em_validacao',
    EM_ANDAMENTO = 'em_andamento',
    CONCLUIDA = 'concluida',
    CANCELADA = 'cancelada',
}

export class UpdateMigrationDto extends PartialType(CreateMigrationDto) {
    @IsEnum(MigrationStatus)
    @IsOptional()
    status?: MigrationStatus;
}
