import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddVariableEntity1699325775451 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS variable (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                "name" varchar NOT NULL,
                "value" text NOT NULL,
                "type" text NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_98419043dd704f54-9830ab78f8" PRIMARY KEY (id)
            );`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE variable`)
    }
}
