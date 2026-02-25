import React from 'react';
import styles from './MetricCard.module.css';

interface MetricCardProps {
    label: string;
    value: string;
    description?: string;
    status?: 'default' | 'danger' | 'warning' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, description, status = 'default' }) => {
    return (
        <div className={`${styles.card} ${styles[status]}`}>
            <p className={styles.label}>{label}</p>
            <h4 className={styles.value}>{value}</h4>
            {description && <p className={styles.description}>{description}</p>}
        </div>
    );
};
