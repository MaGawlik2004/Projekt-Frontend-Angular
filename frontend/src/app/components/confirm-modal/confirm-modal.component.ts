import { Component, Input, Output, EventEmitter, inject, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LanguageService,
  TranslationLanguage,
} from '../../services/language/language-service.service';

@Component({
  selector: 'mg-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  public langService: LanguageService = inject(LanguageService);

  @Input() public title: string = '';
  @Input() public message: string = '';

  @Output() public confirmed: EventEmitter<void> = new EventEmitter<void>();
  @Output() public cancelled: EventEmitter<void> = new EventEmitter<void>();

  public t: Signal<TranslationLanguage> = computed(() => this.langService.t());

  public onConfirm(): void {
    this.confirmed.emit();
  }

  public onCancel(): void {
    this.cancelled.emit();
  }
}
