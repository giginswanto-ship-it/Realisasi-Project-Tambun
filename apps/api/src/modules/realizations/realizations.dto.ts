import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateRealizationItemDto {
  @IsUUID()
  budgetItemId: string;

  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0.01)
  actualQty: number;

  @IsNumber()
  @Min(0)
  actualUnitPrice: number;

  @IsDateString()
  invoiceDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateRealizationDto {
  @IsUUID()
  requestId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRealizationItemDto)
  items: CreateRealizationItemDto[];
}
