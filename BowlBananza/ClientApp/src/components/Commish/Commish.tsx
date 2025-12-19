import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router';
import { ColorContext } from '../../contexts/ColorContext';
import { CommishData } from '../../types/commishTypes';
import MainLoading from '../MainLoading';
import styles from './Styles/Commish.module.css';

const Commish = () => {
    const { isCommish, checked } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(false);
    const [commishData, setCommishData] = useState<CommishData | undefined>(undefined);
    const [selectedCommish, setSelectedCommish] = useState<number>(0);

    useEffect(() => {
        if (checked && !isCommish) {
            navigate('/');
        }
    }, [isCommish, checked, navigate]);

    const { setColor } = React.useContext(ColorContext) ?? { setColor: () => { } };

    useEffect(() => {
        setColor('#ffffff00');
        const glowColors = [
            "#00FFFF", // Cyan
            "#008CFF", // Electric Blue
            "#7A00FF", // Royal Purple
            "#FF00FF", // Magenta
            "#FF0099", // Hot Pink
            "#FF0033", // Neon Red
            "#FF7A00", // Amber Orange
            "#F8FF00", // Neon Yellow
            "#32FF00", // Lime Green
            "#00FF99", // Aqua Green
            "#ffffff00"
        ];
        const timeout = setInterval(() => {
            const c = glowColors.shift();
            glowColors.push(c ?? '');
            setColor(c ?? '');
        }, 5000);
        return () => clearInterval(timeout);
    }, [setColor]);

    useEffect(() => {
        setLoading(true);
        fetch('/commish/getData')
            .then(resp => resp.json())
            .then(result => {
                setCommishData(result);
                setSelectedCommish(result.CurrentCommish);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const lockData = useCallback(() => {
        setLoading(true);
        fetch('/commish/lockData').then(() => setCommishData(data => {
            return {
                ...data,
                CanLockDown: false,
                CanUnlock: true
            } as CommishData;
        })).finally(() => setLoading(false));
    }, []);

    const unlock = useCallback(() => {
        setLoading(true);
        fetch('/commish/unlock').then(() => setCommishData(data => {
            return {
                ...data,
                CanLockDown: true,
                CanUnlock: false
            } as CommishData;
        })).finally(() => setLoading(false));
    }, []);

    const syncData = useCallback(() => {
        setLoading(true)
        fetch('/commish/dataSync').finally(() => setLoading(false));
    }, []);

    const updateData = useCallback(() => {
        setLoading(true)
        fetch('/commish/forceSync').finally(() => setLoading(false));
    }, []);

    const userChanged = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCommish(parseInt(e.target.value));
    }, []);

    const loadTieBreak = useCallback(() => {
        setLoading(true);
        fetch('/commish/loadTieBreak').then(() => setCommishData(data => {
            return {
                ...data,
                CanLoadTieBreak: false
            } as CommishData;
        })).finally(() => setLoading(false));
    }, []);

    const saveCommish = useCallback(() => {
        setLoading(true);
        fetch(`/commish/updateCommish?userId=${selectedCommish}`)
            .then(() => navigate('/'))
            .finally(() => setLoading(false));
    }, [navigate, selectedCommish]);

    if (loading || !commishData) {
        return <MainLoading />;
    }
    return (
        <div className={styles.commishHolder}>
            <div className={styles.commishContent}>
                <h3>Commish Actions</h3>
                {
                    commishData.CanSyncData &&
                    <button className={styles.primaryBtn} onClick={syncData}><span>Sync Data</span></button>
                }
                {
                    commishData.CanForceUpdate &&
                    <button className={styles.primaryBtn} onClick={updateData}><span>Update Data</span></button>
                }
                {
                    commishData.CanLockDown &&
                    <button className={styles.primaryBtn} onClick={lockData}><span>Lock Down</span></button>
                }
                {
                    commishData.CanUnlock &&
                    <button className={styles.primaryBtn} onClick={unlock}><span>Unlock</span></button>
                }
                {
                    commishData.Users.length &&
                    <div className={styles.userHolder}>
                        <label htmlFor="userSelect">Change Commissioner</label>
                        <select id="userSelect" onChange={userChanged} value={selectedCommish}>
                            {
                                commishData.Users.map((user, i) => {
                                    return (
                                        <option value={user.UserId} key={i} selected={user.UserId === selectedCommish}>
                                            {user.UserName}
                                        </option>
                                    );
                                })
                            }
                        </select>
                        {
                            selectedCommish !== commishData.CurrentCommish &&
                            <button className={styles.primaryBtn} onClick={saveCommish}><span>Save</span></button>
                        }
                    </div>
                }
            </div>
        </div>
    );
};

export default Commish;