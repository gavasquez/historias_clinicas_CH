-- AlterTable
ALTER TABLE "historias_clinicas" ADD COLUMN     "previous_status" VARCHAR(50),
ADD COLUMN     "void_ip" VARCHAR(100),
ADD COLUMN     "void_reason" TEXT,
ADD COLUMN     "void_user_agent" VARCHAR(255),
ADD COLUMN     "voided_at" TIMESTAMP(6),
ADD COLUMN     "voided_by" INTEGER;
