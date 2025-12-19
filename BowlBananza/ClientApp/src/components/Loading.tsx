import React from 'react';
import styles from './Shared.module.css'

const Loading = () => {
    return (
        <div className={styles.gridScanner}>
            <div className={`${styles.layer} ${styles.layer1}`}></div>
            <div className={`${styles.layer} ${styles.layer2}`}></div>
            <div className={`${styles.layer} ${styles.layer3}`}></div>
        </div>
    );
};

export default Loading;