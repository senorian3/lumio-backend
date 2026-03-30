import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class PaymentOutput {
  @Field(() => Int, { description: 'Уникальный идентификатор платежа' })
  id: number;

  @Field({ description: 'Кастомный ID платежа' })
  customPaymentId: string;

  @Field(() => Int, { description: 'ID профиля' })
  profileId: number;

  @Field({ description: 'Имя пользователя' })
  username?: string;

  @Field({ nullable: true, description: 'URL аватара' })
  avatarUrl?: string;

  @Field({ nullable: true, description: 'Имя' })
  firstName?: string;

  @Field({ nullable: true, description: 'Фамилия' })
  lastName?: string;

  @Field({ description: 'Автопродление' })
  autoRenewal: boolean;

  @Field({ description: 'Платежный провайдер' })
  paymentProvider: string;

  @Field({ description: 'Валюта' })
  currency: string;

  @Field(() => Float, { description: 'Сумма платежа' })
  amount: number;

  @Field({ description: 'Статус платежа' })
  status: string;

  @Field({ description: 'Дата создания' })
  createdAt: Date;

  @Field({ nullable: true, description: 'Дата следующего платежа' })
  nextPaymentDate?: Date;

  @Field({ description: 'Дата создания в Stripe' })
  stripePaymentCreatedAt: Date;

  @Field({ nullable: true, description: 'Дата обновления' })
  updatedAt?: Date;

  @Field({ nullable: true, description: 'Дата отмены' })
  cancelledAt?: Date;

  @Field({ nullable: true, description: 'ID подписки' })
  subscriptionId?: string;

  @Field({ nullable: true, description: 'ID основной подписки' })
  mainSubscriptionId?: string;

  @Field({ nullable: true, description: 'ID Stripe подписки' })
  stripeSubscriptionId?: string;

  @Field({ description: 'Тип подписки' })
  subscriptionType: string;

  @Field({ nullable: true, description: 'Начало периода' })
  periodStart?: Date;

  @Field({ nullable: true, description: 'Конец периода' })
  periodEnd?: Date;

  @Field({ description: 'URL для оплаты' })
  paymentsUrl: string;
}
