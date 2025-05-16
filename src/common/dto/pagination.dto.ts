import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PaginationDto {

    @Max(50)
    @Min(0)
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    limit: number;


    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    offset: number;
    
}