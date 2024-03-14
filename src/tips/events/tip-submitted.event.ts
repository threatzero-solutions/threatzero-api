import { Tip } from '../entities/tip.entity';

export class TipSubmittedEvent {
  tipId: Tip['id'];

  static forTip(tip: Tip) {
    const event = new TipSubmittedEvent();
    event.tipId = tip.id;
    return event;
  }
}
