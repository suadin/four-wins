import { Directive, ElementRef, HostListener, OnDestroy, Renderer2 } from '@angular/core';

/**
 * One shared tooltip for the footer and the reader sections. The text lives in
 * `data-tip`; `data-tip-wide` selects the wider test variant. It never replaces
 * an `aria-label` on the trigger.
 */
@Directive({ selector: '[appTooltip]' })
export class TooltipDirective implements OnDestroy {
  private tip: HTMLElement | null = null;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
  ) {}

  @HostListener('mouseenter')
  @HostListener('focus')
  show(): void {
    const text = this.host.nativeElement.getAttribute('data-tip');
    if (!text) {
      return;
    }
    this.hide();
    const tip = this.renderer.createElement('div') as HTMLElement;
    this.renderer.addClass(tip, 'tooltip');
    if (this.host.nativeElement.hasAttribute('data-tip-wide')) {
      this.renderer.addClass(tip, 'wide');
    }
    this.renderer.setAttribute(tip, 'role', 'tooltip');
    tip.textContent = text;
    this.renderer.appendChild(document.body, tip);
    this.tip = tip;

    const rect = this.host.nativeElement.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    let top = rect.top - tipRect.height - 12;
    let placement = 'top';
    if (top < 8) {
      top = rect.bottom + 12;
      placement = 'bottom';
    }
    this.renderer.setStyle(tip, 'left', `${Math.round(left)}px`);
    this.renderer.setStyle(tip, 'top', `${Math.round(top)}px`);
    this.renderer.setAttribute(tip, 'data-placement', placement);
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  hide(): void {
    if (this.tip) {
      this.renderer.removeChild(document.body, this.tip);
      this.tip = null;
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    this.hide();
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
