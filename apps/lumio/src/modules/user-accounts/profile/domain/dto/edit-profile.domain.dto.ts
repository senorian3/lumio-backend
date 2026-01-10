import { EditProfileTransferDto } from '../../api/dto/transfer/edit-profile.transfer.dto';

export class EditProfileDomainDto extends EditProfileTransferDto {
  profileUpdatedAt: Date;
}
