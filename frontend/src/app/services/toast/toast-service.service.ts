import { Injectable, signal, WritableSignal } from '@angular/core';
import { Toast } from '../../models/toast';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  public toasts: WritableSignal<Toast[]> = signal<Toast[]>([]);

  public show(message: string, type: Toast['type'] = 'success', duration: number = 4000): void {
    const id: number = Date.now();
    const newToast: Toast = { id, message, type, duration };

    this.toasts.update((current: Toast[]) => [...current, newToast]);

    setTimeout((): void => {
      this.remove(id);
    }, duration);
  }

  public remove(id: number): void {
    this.toasts.update((current: Toast[]) => current.filter((t: Toast) => t.id !== id));
  }
}
