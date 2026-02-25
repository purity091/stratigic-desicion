import React from 'react';
import styles from './InputGroup.module.css';

interface InputGroupProps {
    label: string;
    children: React.ReactNode;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, children }) => (
    <div className={styles.container}>
        <h3 className={styles.label}>{label}</h3>
        <div className={styles.childrenWrapper}>
            {children}
        </div>
    </div>
);
