// import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { UnauthorizedDomainException } from '../../exceptions/domain-exceptions';
// import { Request } from 'express';
// import { DevicesRepository } from '../../../features/devices/infrastructure/devices.repository';
// import { UserAccountsConfig } from '../../../features/user-accounts/config/user-accounts.config';
// import { DeviceEntity } from '../../../features/devices/api/models/device.entity';

// @Injectable()
// export class RefreshTokenGuard implements CanActivate {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly userAccountsConfig: UserAccountsConfig,
//     private readonly devicesRepository: DevicesRepository,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest<Request>();
//     const refreshToken = request.cookies.refreshToken;

//     if (!refreshToken) {
//       throw UnauthorizedDomainException.create(
//         'There is no refresh token in request',
//       );
//     }

//     const payload = this.jwtService.verify(refreshToken, {
//       secret: this.userAccountsConfig.refreshTokenSecret,
//     });

//     const device: DeviceEntity | null =
//       await this.devicesRepository.getDevicebyDeviceId(payload.deviceId);

//     if (!device) {
//       throw UnauthorizedDomainException.create("User doesn't have session");
//     }

//     const exp: string = new Date(payload.exp * 1000).toISOString();

//     if (!device.isDeviceExpDateAndUserIdEquals(payload.userId, exp)) {
//       throw UnauthorizedDomainException.create("User doesn't have session");
//     }

//     if (payload.tokenVersion !== device.tokenVersion) {
//       throw UnauthorizedDomainException.create('Token version mismatch');
//     }

//     request.user = payload;

//     return true;
//   }
// }
