-- AddForeignKey
ALTER TABLE "migration_history" ADD CONSTRAINT "migration_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
