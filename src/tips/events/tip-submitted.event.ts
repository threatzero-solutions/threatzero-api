import { Tip } from '../entities/tip.entity';

export class TipSubmittedEvent {
  tipId: string;

  static forTip(tip: Tip) {
    const event = new TipSubmittedEvent();
    event.tipId = tip.id;
    return event;
  }
}
