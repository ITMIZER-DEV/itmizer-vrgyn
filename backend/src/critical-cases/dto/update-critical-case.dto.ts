import { PartialType } from '@nestjs/swagger';
import { CreateCriticalCaseDto } from './create-critical-case.dto';

export class UpdateCriticalCaseDto extends PartialType(CreateCriticalCaseDto) {}
