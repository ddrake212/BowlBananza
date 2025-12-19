import React from 'react';
import styles from './Styles/GameStyles.module.css';

interface Props {
    onSubmit: () => void;
    onCancel: () => void;
}

const SubmitChoices = ({ onSubmit, onCancel }: Props) => {
    return (
        <div className={styles.submitChoicesHolder}>
            <h3>All teams have been selected</h3>
            <h4>Submit your choices to the Bananza!</h4>
            <div className={styles.SCBtnHolder}>
                <button onClick={onSubmit} className={styles.saveBtn}><span>Submit Choices</span></button>
                <button onClick={onCancel} className={styles.secondaryBtn}><span>Not yet</span></button>
            </div>
        </div>
    );
};

export default SubmitChoices;