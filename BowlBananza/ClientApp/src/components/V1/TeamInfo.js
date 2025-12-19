import React, { useEffect, useCallback, useState } from 'react';
import { DialogBox } from './DialogBox';
import {
    generateMetallicCSS
} from '../utils/colorUtils';
import { Tabs } from './Tabs';

export const TeamInfo = ({ team, gameInfoId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [teamData, setTeamData] = useState(null);
    const populateTeamInfo = useCallback(async () => {
        const response = await fetch('bb/GetTeamStats?team=' + team?.school + '&gameId=' + gameInfoId);
        const data = await response.json();
        setTeamData(data);
        setLoading(false);
    }, [team?.school, gameInfoId, setLoading, setTeamData]);

    useEffect(() => {
        populateTeamInfo();
    }, [populateTeamInfo]);

    const color = generateMetallicCSS(team.alt_color ?? '#000000');

    const content = (
        <div>
            <Tabs tabs={['test1', 'Test2', 'TESTING']} panels={{test1:<div>Test1</div>, Test2: <div>Test2</div>, TESTING: <div>TESTING</div>} }/>
        </div>  
    );
    return (
        <DialogBox onClose={onClose}>
            <div className="teamInfoHeader" style={{ ...color, color: team.color ?? '#ffffff' }}>
                <img src={team.logos[0] ?? team.logos[1]} />
                <div>
                    <div>{team.school}</div>
                    <div>{team.mascot}</div>
                </div>
            </div>
            {loading ? <div className="teamInfoHeaderLoading"><div className="loading"></div></div> : <>{content}</> }
        </DialogBox>    
    );
};