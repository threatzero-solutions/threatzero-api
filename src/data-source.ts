import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import databaseConfig from './config/database.config';
dotenv.config();

export default new DataSource({
  ...databaseConfig(),
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/**/*{.ts,.js}'],
});
