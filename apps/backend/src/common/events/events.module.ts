import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SimpleQueueService } from './event-emitter.service';
import { EventHandlerService } from './event-handler.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 50,
      verboseMemoryLeak: true,
    }),
    PrismaModule,
  ],
  providers: [SimpleQueueService, EventHandlerService],
  exports: [SimpleQueueService, EventHandlerService],
})
export class EventsModule {}
