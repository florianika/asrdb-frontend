import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type Chip = {
  column: string;
  value: string;
};

@Component({
  selector: 'asrdb-chip',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipComponent {
  @Input() chips!: Chip[];
  @Input() clearable!: boolean;
  @Output() remove = new EventEmitter<Chip>;

  removeChip(chip: Chip) {
    this.remove.emit(chip);
  }
}
