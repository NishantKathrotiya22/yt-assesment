import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User.entity';
import { bigintTransformer } from '../utils/transformers';

export enum UploadSessionStatus {
  INITIATED = 'INITIATED',
  COMPLETED = 'COMPLETED',
  ABORTED = 'ABORTED',
}

@Entity('upload_sessions')
export class UploadSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'varchar', length: 1000 })
  s3Key: string;

  @Column({ type: 'varchar', length: 500 })
  s3UploadId: string;

  @Column({ type: 'varchar', length: 500 })
  fileName: string;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  fileSize: number;

  @Column({ type: 'varchar', length: 150 })
  contentType: string;

  @Column({ type: 'int' })
  partSize: number;

  @Column({ type: 'int' })
  totalParts: number;

  @Column({ type: 'enum', enum: UploadSessionStatus, default: UploadSessionStatus.INITIATED })
  status: UploadSessionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
