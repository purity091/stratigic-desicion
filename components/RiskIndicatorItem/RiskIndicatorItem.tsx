import React from 'react';
import styles from './RiskIndicatorItem.module.css';
import { RiskIndicator } from '../../types';

export const RiskIndicatorItem: React.FC<{ indicator: RiskIndicator }> = ({ indicator }) => {
    return (
        <div className={styles.container}>
            <div className={`${styles.indicator} ${styles[indicator.status]}`} />
            <div className={styles.contentWrapper}>
                <h5 className={styles.title}>{indicator.label}: {indicator.value}</h5>
                <p className={styles.description}>{indicator.description}</p>
            </div>
        </div>
    );
};
