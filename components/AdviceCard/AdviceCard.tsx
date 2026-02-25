import React from 'react';
import styles from './AdviceCard.module.css';

interface AdviceCardProps {
    title: string;
    content: string;
    type: 'info' | 'warning' | 'positive';
}

export const AdviceCard: React.FC<AdviceCardProps> = ({ title, content, type }) => {
    const icons = {
        info: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
        warning: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>,
        positive: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    };

    return (
        <div className={`${styles.card} ${styles[type]}`}>
            <div className={styles.icon}>{icons[type]}</div>
            <div>
                <h5 className={styles.title}>{title}</h5>
                <p className={styles.content}>{content}</p>
            </div>
        </div>
    );
};
