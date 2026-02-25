import React from 'react';
import styles from './RangeInput.module.css';

interface RangeInputProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
    onChange: (val: number) => void;
}

export const RangeInput: React.FC<RangeInputProps> = ({
    label,
    value,
    min,
    max,
    step = 1,
    suffix = '',
    onChange
}) => (
    <div className={styles.container}>
        <div className={styles.header}>
            <label className={styles.label}>{label}</label>
            <span className={styles.value}>{value}{suffix}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={styles.input}
        />
    </div>
);
