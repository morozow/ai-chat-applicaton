import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
    content: string;
    children: ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

function Tooltip({ content, children, position = 'top', delay = 300 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const timeoutRef = useRef<number | null>(null);
    const triggerRef = useRef<HTMLSpanElement>(null);

    const calculatePosition = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const gap = 8;

        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = rect.top - gap;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - gap;
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + gap;
                break;
        }

        setCoords({ top, left });
    }, [position]);

    const showTooltip = () => {
        timeoutRef.current = window.setTimeout(() => {
            calculatePosition();
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <span
            ref={triggerRef}
            className={styles.wrapper}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            {isVisible && (
                <span
                    className={`${styles.tooltip} ${styles[position]}`}
                    style={{ top: coords.top, left: coords.left }}
                    role="tooltip"
                >
                    {content}
                </span>
            )}
        </span>
    );
}

export default Tooltip;
