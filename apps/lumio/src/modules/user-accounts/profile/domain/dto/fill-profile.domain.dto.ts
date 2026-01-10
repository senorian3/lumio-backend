import { FillProfileTransferDto } from '../../api/dto/transfer/fill-profile.transfer.dto';

export class FillProfileDomainDto extends FillProfileTransferDto {
  profileFilledAt: Date;
  profileFilled: boolean;
}
