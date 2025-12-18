-- CreateTable
CREATE TABLE "Yandex" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(40) NOT NULL,
    "yandexId" VARCHAR(100) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Yandex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Yandex_yandexId_key" ON "Yandex"("yandexId");

-- CreateIndex
CREATE UNIQUE INDEX "Yandex_userId_key" ON "Yandex"("userId");

-- AddForeignKey
ALTER TABLE "Yandex" ADD CONSTRAINT "Yandex_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
