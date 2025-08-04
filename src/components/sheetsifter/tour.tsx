
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface TourStep {
  target: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

export function Tour({ steps, isOpen, onClose }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) {
        setCurrentStep(0);
        return;
    };
    
    const updateTarget = () => {
        const step = steps[currentStep];
        if (!step) return;

        const targetElement = document.querySelector(step.target);
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect();
          setTargetRect(rect);
        } else {
          // If target is not found, try again after a short delay
          setTimeout(updateTarget, 100);
        }
    };
    
    // Delay to allow elements to render, especially after state changes
    setTimeout(updateTarget, 50);

  }, [currentStep, isOpen, steps]);

  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const placement = steps[currentStep]?.placement || 'bottom';
    const gap = 12;

    let top = 0, left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + gap;
        break;
    }

    // Adjust if out of viewport
    if (left < 0) left = gap;
    if (top < 0) top = gap;
    if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - gap;
    if (top + tooltipRect.height > window.innerHeight) top = window.innerHeight - tooltipRect.height - gap;
    
    setTooltipPosition({ top, left });
  }, [targetRect, currentStep, steps]);


  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen || !targetRect) return null;

  const { target } = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{
          clipPath: `path('${`
            M0 0 H${window.innerWidth} V${window.innerHeight} H0Z
            M${targetRect.x} ${targetRect.y} 
            h${targetRect.width} 
            v${targetRect.height} 
            h-${targetRect.width}Z
            `}')`
        }}
      ></div>
      
      <div
        ref={tooltipRef}
        className="fixed z-[101] bg-background text-foreground p-4 rounded-lg shadow-2xl w-80 max-w-[90vw] animate-in fade-in-50"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <button onClick={handleSkip} className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <p className="text-sm mb-4 pr-4">{steps[currentStep].content}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>
          <Button onClick={handleNext} size="sm">
            {currentStep < steps.length - 1 ? 'Próximo' : 'Concluir'}
          </Button>
        </div>
      </div>
    </div>
  );
}
