import { IsString, IsUUID, IsUrl, IsIn } from 'class-validator';

export class CreateIntegrationDto {
  @IsString()
  @IsIn(['booking', 'airbnb'])
  channel: string;

  @IsUrl()
  icalUrl: string;

  @IsUUID()
  roomId: string;
}
