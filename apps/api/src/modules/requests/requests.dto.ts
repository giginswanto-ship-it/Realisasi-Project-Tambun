import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApprovalDecision, ExpenseRequestType } from '@tambun/shared';

export class CreateRequestItemDto {
  @IsUUID()
  budgetItemId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0.01)
  requestedQty: number;

  @IsNumber()
  @Min(0)
  estimatedUnitPrice: number;
}

export class CreateExpenseRequestDto {
  @IsUUID()
  projectId: string;

  @IsEnum(ExpenseRequestType)
  type: ExpenseRequestType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsDateString()
  needByDate: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRequestItemDto)
  items: CreateRequestItemDto[];
}

export class ApprovalActionDto {
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @IsString()
  @IsOptional()
  comment?: string;
}
