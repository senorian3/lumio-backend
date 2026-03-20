import { ObjectType } from '@nestjs/graphql';
import { PaginatedResponse } from '@super-admin/core/schema/paginated-response.entity';
import { User } from '@super-admin/modules/users/domain/schema/user.schema';

@ObjectType()
export class PaginatedUserResponse extends PaginatedResponse(User) {}
